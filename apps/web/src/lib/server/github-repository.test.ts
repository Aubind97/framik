import { describe, expect, test } from "bun:test";
import { type RepositoryActivity, renderRepositorySvg } from "./github-repository.ts";

const now = new Date("2026-11-26T12:00:00Z");
const activity: RepositoryActivity = {
	name: "owner/repo",
	stars: 1234,
	forks: 5,
	avatar: null,
	commits: [{ message: "fix: escape <script> & 🚀 emoji", date: "2026-11-26T11:22:00Z" }],
	pulls: [{ title: "x".repeat(200), date: "2026-11-24T12:00:00Z" }],
	openPulls: 7,
};

describe("renderRepositorySvg", () => {
	test("escapes untrusted text and drops emoji", () => {
		const svg = renderRepositorySvg(activity, now);
		expect(svg).toContain("fix: escape &#60;script&#62; &#38; emoji");
		expect(svg).not.toContain("<script>");
	});

	test("shows ages, totals and truncates long titles", () => {
		const svg = renderRepositorySvg(activity, now);
		expect(svg).toContain(">38m<");
		expect(svg).toContain(">2d<");
		expect(svg).toContain("(7 total)");
		expect(svg).toContain("…");
		expect(svg).toContain("1,234 stars");
	});

	test("omits the pull request section when not requested", () => {
		expect(renderRepositorySvg({ ...activity, pulls: null }, now)).not.toContain("Open pull requests");
	});
});
