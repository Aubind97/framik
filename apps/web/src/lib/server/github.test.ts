import { describe, expect, test } from "bun:test";
import { type ContributionDay, getContributionStats, parseContributions, renderContributionsSvg } from "./github.ts";

const day = (id: string, date: string, level: number) =>
	`<td tabindex="0" data-ix="0" aria-describedby="contribution-graph-legend-level-${level}" style="width: 10px" data-date="${date}" id="${id}" data-level="${level}" role="gridcell" data-view-component="true" class="ContributionCalendar-day">`;
const tip = (id: string, text: string) =>
	`<tool-tip style="pointer-events: none;" id="tooltip-${id}" for="${id}" popover="manual" data-type="label" class="sr-only">${text}</tool-tip>`;

const days = (counts: number[]): ContributionDay[] => counts.map((count, i) => ({ date: `2026-01-${String(i + 1).padStart(2, "0")}`, count, level: count ? 1 : 0 }));

describe("parseContributions", () => {
	test("reads date, level and tooltip count, sorted by date", () => {
		const html = [
			day("d-1", "2026-01-02", 4),
			day("d-0", "2026-01-01", 0),
			tip("d-0", "No contributions on January 1st."),
			tip("d-1", "1,204 contributions on January 2nd."),
			'<td class="ContributionCalendar-label">Mon</td>',
		].join("\n");

		expect(parseContributions(html)).toEqual([
			{ date: "2026-01-01", count: 0, level: 0 },
			{ date: "2026-01-02", count: 1204, level: 4 },
		]);
	});

	test("returns nothing for unrelated markup", () => {
		expect(parseContributions("<html><body>Not Found</body></html>")).toEqual([]);
	});
});

describe("getContributionStats", () => {
	test("sums counts and finds the longest run", () => {
		expect(getContributionStats(days([1, 2, 0, 3, 3, 3, 0, 1]))).toEqual({ total: 13, currentStreak: 1, longestStreak: 3 });
	});

	test("today without contributions keeps yesterday's streak", () => {
		expect(getContributionStats(days([0, 5, 1, 0])).currentStreak).toBe(2);
	});

	test("a gap before today ends the streak", () => {
		expect(getContributionStats(days([5, 0, 0])).currentStreak).toBe(0);
	});
});

describe("renderContributionsSvg", () => {
	test("draws one cell per day and the stats", () => {
		const svg = renderContributionsSvg("octocat", days([1, 0, 4]));
		expect(svg.match(/<rect x=/g)).toHaveLength(3);
		expect(svg).toContain("GitHub/octocat");
		expect(svg).toContain(">5</text>");
	});

	test("shows either the avatar or the GitHub logo", () => {
		const withAvatar = renderContributionsSvg("octocat", days([1]), "data:image/png;base64,AAAA");
		expect(withAvatar).toContain("<image");
		expect(withAvatar).not.toContain("<path");
		expect(renderContributionsSvg("octocat", days([1]))).toContain("<path");
	});
});
