import { describe, expect, test } from "bun:test";
import { parsePolls, renderRankingSvg, renderTrendSvg, spreadLabels, summarizePolls, summarizeTrend } from "./presidential.ts";

const header = (name: string, party: string) =>
	`<th><img src="//thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/${name}.jpg/40px-${name}.jpg?utm_source=x" /><br /><a>${name}</a><sup class="reference">[a]</sup><br /><small>(<a>${party}</a>)</small></th>`;
const table = (rows: string) =>
	`<table><tr><th rowspan="2">Sondeur</th><th>Date</th><th>Échantillon</th>${header("Mélenchon", "LFI")}${header("Philippe", "HOR")}${header("Le Pen", "RN")}<th>Autres</th></tr>${rows}</table>`;
const row = (...values: string[]) => `<tr>${values.map((value) => `<td>${value}</td>`).join("")}</tr>`;

const PAGE = [
	'<h2 id="Sondages_concernant_le_premier_tour">Sondages concernant le premier tour</h2>',
	"<h5>Octobre-décembre 2026</h5>",
	table(
		[
			row("", "", "", ""),
			'<tr><td colspan="7">Untel retire sa candidature</td></tr>',
			row("Harris", "18-19 novembre", "2&#160;088", "18", "12", "<b>31</b>", "4"),
			row("20", "—", "33", "5"),
			row("Ifop", "3-5 novembre", "1&#160;000", "17,5", "14", "34", "—"),
		].join(""),
	),
	"<h5>Juillet-septembre 2026</h5>",
	table(row("Elabe", "28 septembre - 1<sup>er</sup> octobre 2026", "900", "16", "15", "36", "—")),
	'<h2 id="Sondages_concernant_le_second_tour">Sondages concernant le second tour</h2>',
].join("");

describe("parsePolls", () => {
	const { candidates, polls } = parsePolls(PAGE);

	test("reads candidates and portraits from the most recent table", () => {
		expect(candidates.map(({ name, party }) => `${name} (${party})`)).toEqual(["Mélenchon (LFI)", "Philippe (HOR)", "Le Pen (RN)"]);
		expect(candidates[0]?.photo).toBe("https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Mélenchon.jpg/250px-Mélenchon.jpg");
	});

	test("groups hypotheses under their poll and dates it with the heading year", () => {
		expect(polls.map((poll) => [poll.date.toDateString(), poll.hypotheses.length])).toEqual([
			[new Date(2026, 10, 19).toDateString(), 2],
			[new Date(2026, 10, 5).toDateString(), 1],
			[new Date(2026, 9, 1).toDateString(), 1],
		]);
		expect(polls[0]?.hypotheses[1]?.has("Philippe")).toBe(false);
		expect(polls[1]?.hypotheses[0]?.get("Mélenchon")).toBe(17.5);
	});

	test("fails loudly when the page layout changes", () => {
		expect(() => parsePolls("<p>nothing</p>")).toThrow("layout");
	});
});

describe("summarizePolls", () => {
	const { candidates, polls } = parsePolls(PAGE);
	const summary = summarizePolls(candidates, polls);

	test("counts each poll once and ranks the 30-day average", () => {
		expect(summary.pollCount).toBe(2);
		expect(summary.ranking.map(({ name }) => name)).toEqual(["Le Pen", "Mélenchon", "Philippe"]);
		// Harris hypotheses (31, 33) average to 32 before averaging with Ifop's 34
		expect(summary.ranking[0]?.score).toBe(33);
	});

	test("compares with the 30 days before", () => {
		expect(summary.ranking[0]?.trend).toBe(-3);
		expect(summary.ranking[1]?.trend).toBeCloseTo(2.25);
	});
});

describe("renderRankingSvg", () => {
	test("shows the top two big and the next three as a list", () => {
		const ranking = ["A", "B", "C", "D", "E", "F"].map((name, index) => ({ name, party: "RN", photo: null, score: 30 - index * 5, trend: index === 0 ? 1.2 : null }));
		const svg = renderRankingSvg({ pollCount: 14, from: new Date(2026, 9, 20), to: new Date(2026, 10, 19), ranking });
		expect(svg).toContain("moyenne de 14 sondages");
		expect(svg).toContain("30,0<tspan");
		expect(svg).toContain("▲ 1,2 pt");
		expect(svg).toContain("15,0 %");
		expect(svg).not.toContain(">F<");
	});
});

describe("summarizeTrend", () => {
	const { candidates, polls } = parsePolls(PAGE);
	const { dates, series } = summarizeTrend(candidates, polls);

	test("follows today's leaders up to the latest poll, with gaps where no poll is near", () => {
		expect(series.map(({ name }) => name)).toEqual(["Le Pen", "Mélenchon", "Philippe"]);
		expect(dates.at(-1)?.toDateString()).toBe(new Date(2026, 10, 19).toDateString());
		const lePen = series[0]?.points ?? [];
		expect(lePen[0]).toBeNull();
		expect(lePen.at(-1)).toBeGreaterThan(32);
		expect(lePen.at(-1)).toBeLessThan(34);
	});

	test("renders a dashed line for a second candidate of the same party ink", () => {
		const svg = renderTrendSvg({ dates, series: [...series, { ...(series[1] as (typeof series)[number]), name: "Roussel" }] });
		expect(svg).toContain('stroke-dasharray="14 9"');
		expect(svg).toContain("Roussel");
	});
});

describe("spreadLabels", () => {
	test("keeps labels apart and inside the chart", () => {
		expect(spreadLabels([100, 105, 300], 26, 80, 400)).toEqual([100, 126, 300]);
		expect(spreadLabels([395, 398], 26, 80, 400)).toEqual([374, 400]);
	});
});
