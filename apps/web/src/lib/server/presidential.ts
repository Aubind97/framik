import { fetchAvatar, fitText, HEIGHT, INK, svgDocument, USER_AGENT, WIDTH } from "#lib/server/svg.ts";

export type Candidate = { name: string; party: string; photo: string | null };
export type Poll = { date: Date; hypotheses: Map<string, number>[] };
export type Ranked = Candidate & { score: number; trend: number | null };
export type PollSummary = { pollCount: number; from: Date; to: Date; ranking: Ranked[] };

const PAGE = "Liste de sondages sur l'élection présidentielle française de 2027";
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DATE_PATTERN = new RegExp(`(\\d{1,2})\\s+(${MONTHS.join("|")})(?:\\s+(20\\d\\d))?`, "g");
const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const PHOTO_WIDTH = 250;

const cellText = (html: string) =>
	html
		// Footnote markers and ordinal suffixes ("1<sup>er</sup>")
		.replace(/<sup[\s\S]*?<\/sup>/g, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/&#160;|&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&#91;\w+&#93;/g, "")
		.replace(/\s+/g, " ")
		.trim();

const cells = (row: string, tag: "td" | "th") => [...row.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g"))].map((match) => match[1] ?? "");

/** Fieldwork end date, e.g. "18-19 novembre" or "31 janvier - 1 février 2024"; the year falls back to the section heading. */
function parseEndDate(text: string, headingYear: number | null): Date | null {
	const last = [...text.matchAll(DATE_PATTERN)].at(-1);
	const year = last?.[3] ? Number(last[3]) : headingYear;
	if (!last || !year) return null;
	return new Date(year, MONTHS.indexOf(last[2] ?? ""), Number(last[1]));
}

function parseScore(text: string) {
	const match = text.match(/^<?\s*(\d+(?:[.,]\d+)?)/);
	return match?.[1] ? Number(match[1].replace(",", ".")) : null;
}

function parseCandidate(header: string): Candidate {
	const text = cellText(header);
	const src = header.match(/<img[^>]*\ssrc="([^"]+)"/)?.[1];
	return {
		name: text.replace(/\s*\(.*$/, "").trim(),
		party: text.match(/\(\s*([^)]+?)\s*\)/)?.[1] ?? "",
		photo: src ? `https:${src.replace(/\?.*$/, "").replace(/\/\d+px-/, `/${PHOTO_WIDTH}px-`)}` : null,
	};
}

/** First-round polls of the rendered Wikipedia page, and the candidates of its most recent table. */
export function parsePolls(html: string): { candidates: Candidate[]; polls: Poll[] } {
	const start = html.indexOf('id="Sondages_concernant_le_premier_tour"');
	const end = html.indexOf('id="Sondages_concernant_le_second_tour"');
	if (start === -1 || end === -1) throw new Error("The Wikipedia poll page changed its layout");

	const candidates: Candidate[] = [];
	const polls: Poll[] = [];
	let headingYear: number | null = null;

	for (const [, heading, table] of html.slice(start, end).matchAll(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>|<table[^>]*>([\s\S]*?)<\/table>/g)) {
		if (heading !== undefined) {
			const year = cellText(heading).match(/20\d\d/)?.[0];
			if (year) headingYear = Number(year);
			continue;
		}

		const [headerRow = "", ...rows] = [...(table ?? "").matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((match) => match[1] ?? "");
		const headers = cells(headerRow, "th");
		if (!cellText(headers[0] ?? "").startsWith("Sondeur")) continue;

		const columns = headers.slice(3).map(parseCandidate);
		if (candidates.length === 0) candidates.push(...columns.filter((column) => column.name !== "Autres"));

		let poll: Poll | null = null;
		for (const row of rows) {
			const values = cells(row, "td").map(cellText);
			if (values.length === columns.length + 3) {
				const date = parseEndDate(values[1] ?? "", headingYear);
				poll = date ? { date, hypotheses: [] } : null;
				if (poll) polls.push(poll);
				values.splice(0, 3);
			} else if (values.length !== columns.length) continue;

			const hypothesis = new Map<string, number>();
			columns.forEach(({ name }, index) => {
				const score = parseScore(values[index] ?? "");
				if (name !== "Autres" && score !== null) hypothesis.set(name, score);
			});
			if (poll && hypothesis.size > 0) poll.hypotheses.push(hypothesis);
		}
	}

	return { candidates, polls: polls.filter((poll) => poll.hypotheses.length > 0) };
}

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/** A candidate's score in one poll: the mean of the hypotheses that test them. */
function pollScore({ hypotheses }: Poll, name: string): number | null {
	const scores = hypotheses.flatMap((hypothesis) => hypothesis.get(name) ?? []);
	return scores.length > 0 ? mean(scores) : null;
}

/** Per-candidate average where each poll counts once, its hypotheses averaged first. */
function averageScores(polls: Poll[]) {
	const names = new Set(polls.flatMap(({ hypotheses }) => hypotheses.flatMap((hypothesis) => [...hypothesis.keys()])));
	return new Map(
		[...names].map((name) => {
			const scores = polls.flatMap((poll) => pollScore(poll, name) ?? []);
			return [name, mean(scores)] as const;
		}),
	);
}

/** Averages the polls of the last 30 days before the latest one, with the trend against the 30 days before. */
export function summarizePolls(candidates: Candidate[], polls: Poll[]): PollSummary {
	if (polls.length === 0) throw new Error("No poll found on the Wikipedia page");

	const to = new Date(Math.max(...polls.map((poll) => poll.date.getTime())));
	const age = (poll: Poll) => (to.getTime() - poll.date.getTime()) / DAY_MS;
	const current = polls.filter((poll) => age(poll) < WINDOW_DAYS);
	const previous = averageScores(polls.filter((poll) => age(poll) >= WINDOW_DAYS && age(poll) < WINDOW_DAYS * 2));

	const ranking = [...averageScores(current)]
		.map(([name, score]) => {
			const before = previous.get(name);
			const candidate = candidates.find((known) => known.name === name) ?? { name, party: "", photo: null };
			return { ...candidate, score, trend: before === undefined ? null : score - before };
		})
		.sort((a, b) => b.score - a.score);

	const from = new Date(Math.min(...current.map((poll) => poll.date.getTime())));
	return { pollCount: current.length, from, to, ranking };
}

export async function fetchPollPage(): Promise<{ candidates: Candidate[]; polls: Poll[] }> {
	const params = new URLSearchParams({ action: "parse", page: PAGE, prop: "text", format: "json", formatversion: "2", disableeditsection: "1", disablelimitreport: "1" });
	const response = await fetch(`https://fr.wikipedia.org/w/api.php?${params}`, { headers: { "User-Agent": USER_AGENT }, redirect: "error", signal: AbortSignal.timeout(15_000) });
	if (!response.ok) throw new Error(`Wikipedia responded ${response.status}`);
	const { parse } = (await response.json()) as { parse?: { text: string } };
	if (!parse) throw new Error("Wikipedia did not return the poll page");

	return parsePolls(parse.text);
}

/** Embeds the portraits of the two leaders, the only ones the ranking shows. */
export async function withLeaderPhotos(summary: PollSummary): Promise<PollSummary> {
	const leaders = await Promise.all(summary.ranking.slice(0, 2).map(async (candidate) => ({ ...candidate, photo: candidate.photo && (await fetchAvatar(candidate.photo)) })));
	return { ...summary, ranking: [...leaders, ...summary.ranking.slice(2)] };
}

const PARTY_INK: Record<string, string> = {
	LO: INK.red,
	LFI: INK.red,
	PCF: INK.red,
	PS: INK.red,
	PP: INK.red,
	LE: INK.green,
	RE: INK.yellow,
	HOR: INK.yellow,
	MoDem: INK.yellow,
	LR: INK.blue,
	NE: INK.blue,
	DLF: INK.blue,
	UDI: INK.blue,
	DVD: INK.blue,
};
const partyInk = (party: string) => PARTY_INK[party] ?? INK.black;

const SANS = "DejaVu Sans";
const PAD = 32;
const formatScore = (score: number) => score.toFixed(1).replace(".", ",");
const formatDay = (date: Date, year = false) => date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", ...(year && { year: "numeric" }) });

function trendText(trend: number | null, x: number, y: number, fontSize: number, anchor: "start" | "end" = "start") {
	if (trend === null || Math.abs(trend) < 0.5) return "";
	const [arrow, fill] = trend > 0 ? ["▲", INK.green] : ["▼", INK.red];
	return `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${fontSize}" text-anchor="${anchor}" fill="${fill}">${arrow} ${formatScore(Math.abs(trend))} pt</text>`;
}

function leaderCard(candidate: Ranked, index: number) {
	const x = PAD + index * (WIDTH / 2 - PAD / 2);
	const [top, width, height] = [84, 150, 200];
	const textX = x + width + 20;
	const textWidth = WIDTH / 2 - width - PAD - 20;
	const photo = candidate.photo
		? `<clipPath id="leader-${index}"><rect x="${x}" y="${top}" width="${width}" height="${height}" rx="16"/></clipPath><image href="${candidate.photo}" x="${x}" y="${top}" width="${width}" height="${height}" preserveAspectRatio="xMidYMin slice" clip-path="url(#leader-${index})"/>`
		: `<rect x="${x}" y="${top}" width="${width}" height="${height}" rx="16" fill="${partyInk(candidate.party)}"/>`;
	return [
		photo,
		`<text x="${textX}" y="${top + 30}" font-family="${SANS}" font-size="28" font-weight="bold">${fitText(candidate.name, 30, textWidth)}</text>`,
		`<rect x="${textX}" y="${top + 46}" width="16" height="16" rx="4" fill="${partyInk(candidate.party)}"/>`,
		`<text x="${textX + 24}" y="${top + 60}" font-family="${SANS}" font-size="18">${fitText(candidate.party, 18, textWidth - 24)}</text>`,
		`<text x="${textX}" y="${top + 140}" font-family="${SANS}" font-size="56" font-weight="bold">${formatScore(candidate.score)}<tspan font-size="28" dx="8">%</tspan></text>`,
		trendText(candidate.trend, textX, top + 180, 20),
	].join("");
}

function listRow(candidate: Ranked, index: number) {
	const y = 346 + index * 38;
	return [
		`<rect x="${PAD}" y="${y - 20}" width="24" height="24" rx="6" fill="${partyInk(candidate.party)}"/>`,
		`<text x="${PAD + 40}" y="${y}" font-family="${SANS}" font-size="24">${fitText(candidate.name, 22, 300)}<tspan font-size="18" dx="10">${fitText(candidate.party, 18, 120)}</tspan></text>`,
		`<text x="${WIDTH - PAD - 150}" y="${y}" font-family="${SANS}" font-size="24" font-weight="bold" text-anchor="end">${formatScore(candidate.score)} %</text>`,
		trendText(candidate.trend, WIDTH - PAD, y, 20, "end"),
	].join("");
}

export function renderRankingSvg(summary: PollSummary): string {
	const leaders = summary.ranking.slice(0, 2);
	const followers = summary.ranking.slice(2, 5);
	return svgDocument(
		[
			`<text x="${PAD}" y="52" font-family="${SANS}" font-size="30" font-weight="bold">Présidentielle 2027</text>`,
			`<text x="${WIDTH - PAD}" y="50" font-family="${SANS}" font-size="18" text-anchor="end">1er tour · moyenne de ${summary.pollCount} sondages</text>`,
			...leaders.map(leaderCard),
			`<rect x="${PAD}" y="304" width="${WIDTH - PAD * 2}" height="1"/>`,
			...followers.map(listRow),
			`<text x="${PAD}" y="${HEIGHT - 18}" font-family="${SANS}" font-size="14">Source : Wikipédia · sondages du ${formatDay(summary.from)} au ${formatDay(summary.to, true)}</text>`,
		].join(""),
	);
}

export type TrendSeries = Ranked & { points: (number | null)[] };
export type PollTrend = { dates: Date[]; series: TrendSeries[] };

const TREND_CANDIDATES = 5;
const TREND_DAYS = 365;
const TREND_STEP_DAYS = 3;
const SMOOTHING_DAYS = 14;

/** Gaussian-weighted average of a candidate's polls around `date`; null when no poll is within 3 sigma. */
function smoothedScore(polls: Poll[], name: string, date: Date): number | null {
	let weighted = 0;
	let weights = 0;
	for (const poll of polls) {
		const distance = (poll.date.getTime() - date.getTime()) / DAY_MS / SMOOTHING_DAYS;
		const score = Math.abs(distance) <= 3 ? pollScore(poll, name) : null;
		if (score === null) continue;
		const weight = Math.exp(-(distance ** 2) / 2);
		weighted += weight * score;
		weights += weight;
	}
	return weights > 0 ? weighted / weights : null;
}

/** Smoothed curves of today's top candidates over the last year, like Wikipedia's chart. */
export function summarizeTrend(candidates: Candidate[], polls: Poll[]): PollTrend {
	const { to, ranking } = summarizePolls(candidates, polls);
	const steps = Math.floor(TREND_DAYS / TREND_STEP_DAYS);
	const dates = Array.from({ length: steps + 1 }, (_, step) => new Date(to.getTime() - (steps - step) * TREND_STEP_DAYS * DAY_MS));
	const series = ranking.slice(0, TREND_CANDIDATES).map((candidate) => ({ ...candidate, points: dates.map((date) => smoothedScore(polls, candidate.name, date)) }));
	return { dates, series };
}

const CHART = { left: 72, right: 576, top: 84, bottom: 412 };
const LABEL_GAP = 26;

/** Spreads label positions at least `gap` apart while staying within [min, max]. */
export function spreadLabels(positions: number[], gap: number, min: number, max: number): number[] {
	const order = positions.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
	for (let i = 0; i < order.length; i++) order[i].y = Math.max(order[i].y, min, i > 0 ? order[i - 1].y + gap : min);
	for (let i = order.length - 1; i >= 0; i--) order[i].y = Math.min(order[i].y, i < order.length - 1 ? order[i + 1].y - gap : max);
	const spread = [...positions];
	for (const { y, index } of order) spread[index] = y;
	return spread;
}

export function renderTrendSvg({ dates, series }: PollTrend): string {
	const first = dates[0] ?? new Date();
	const last = dates.at(-1) ?? new Date();
	const span = Math.max(1, last.getTime() - first.getTime());
	const peak = Math.max(10, ...series.flatMap(({ points }) => points.filter((point) => point !== null)));
	const ceiling = Math.ceil((peak + 2) / 10) * 10;
	const x = (date: Date) => CHART.left + ((date.getTime() - first.getTime()) / span) * (CHART.right - CHART.left);
	const y = (score: number) => CHART.bottom - (score / ceiling) * (CHART.bottom - CHART.top);

	const grid = Array.from({ length: ceiling / 10 + 1 }, (_, step) => {
		const value = step * 10;
		const dash = value === 0 ? "" : ' stroke-dasharray="2 5"';
		return `<line x1="${CHART.left}" x2="${CHART.right}" y1="${y(value)}" y2="${y(value)}" stroke="${INK.black}" stroke-width="1" shape-rendering="crispEdges"${dash}/><text x="${CHART.left - 10}" y="${y(value) + 5}" font-family="${SANS}" font-size="14" text-anchor="end">${value} %</text>`;
	});

	const months: string[] = [];
	for (let month = new Date(first.getFullYear(), first.getMonth() + 1, 1); month <= last; month = new Date(month.getFullYear(), month.getMonth() + 1, 1)) {
		const label = month.toLocaleDateString("fr-FR", { month: "short" });
		months.push(
			`<line x1="${x(month)}" x2="${x(month)}" y1="${CHART.bottom}" y2="${CHART.bottom + 6}" stroke="${INK.black}" shape-rendering="crispEdges"/><text x="${x(month)}" y="${CHART.bottom + 24}" font-family="${SANS}" font-size="14" text-anchor="middle">${label}</text>`,
		);
	}

	const usedInks = new Set<string>();
	const styled = series.map((candidate) => {
		const ink = partyInk(candidate.party);
		const dashed = usedInks.has(ink);
		usedInks.add(ink);
		return { ...candidate, ink, dashed };
	});

	// Draw the leader last so it stays on top where lines cross
	const lines = [...styled].reverse().map(({ points, ink, dashed }) => {
		let path = "";
		let pen = "M";
		points.forEach((score, index) => {
			if (score === null) {
				pen = "M";
				return;
			}
			path += `${pen}${x(dates[index] ?? first).toFixed(1)} ${y(score).toFixed(1)} `;
			pen = "L";
		});
		const dash = dashed ? ' stroke-dasharray="14 9"' : "";
		return `<path d="${path.trim()}" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
	});

	const ends = styled.map(({ points, score }) => y(points.findLast((point) => point !== null) ?? score));
	const labelX = CHART.right + 18;
	const labels = spreadLabels(ends, LABEL_GAP, CHART.top, CHART.bottom).map((labelY, index) => {
		const { name, score, ink, dashed } = styled[index] as (typeof styled)[number];
		const swatch = dashed
			? `<rect x="${labelX}" y="${labelY - 8}" width="7" height="6" fill="${ink}"/><rect x="${labelX + 11}" y="${labelY - 8}" width="7" height="6" fill="${ink}"/>`
			: `<rect x="${labelX}" y="${labelY - 13}" width="18" height="16" rx="4" fill="${ink}"/>`;
		return `${swatch}<text x="${labelX + 26}" y="${labelY}" font-family="${SANS}" font-size="16">${fitText(name, 14, 112)}<tspan font-weight="bold" dx="6">${formatScore(score)}</tspan></text>`;
	});

	return svgDocument(
		[
			`<text x="${PAD}" y="52" font-family="${SANS}" font-size="30" font-weight="bold">Présidentielle 2027</text>`,
			`<text x="${WIDTH - PAD}" y="50" font-family="${SANS}" font-size="18" text-anchor="end">1er tour · moyenne lissée des sondages</text>`,
			...grid,
			...months,
			...lines,
			...labels,
			`<text x="${PAD}" y="${HEIGHT - 12}" font-family="${SANS}" font-size="14">Source : Wikipédia · ${formatDay(first, true)} – ${formatDay(last, true)}</text>`,
		].join(""),
	);
}
