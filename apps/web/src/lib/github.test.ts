import { describe, expect, test } from "bun:test";
import { isScheduleDue, validateGithubConfig } from "./github.ts";

describe("isScheduleDue", () => {
	const at = (time: string) => new Date(`2026-11-26T${time}`);

	test("a schedule that never pushed is due", () => {
		expect(isScheduleDue("contributions", null)).toBe(true);
	});

	test("daily modes push once per local day", () => {
		expect(isScheduleDue("contributions", at("00:10:00"), at("23:50:00"))).toBe(false);
		expect(isScheduleDue("contributions", new Date(2026, 10, 25, 23, 50), new Date(2026, 10, 26, 0, 5))).toBe(true);
	});
});

describe("hourly schedules", () => {
	test("are due again after about an hour", () => {
		const last = new Date("2026-11-26T10:00:00");
		expect(isScheduleDue("repository", last, new Date("2026-11-26T10:30:00"))).toBe(false);
		expect(isScheduleDue("repository", last, new Date("2026-11-26T10:56:00"))).toBe(true);
	});
});

describe("validateGithubConfig", () => {
	test("caps repository rows to what fits on the frame", () => {
		expect(validateGithubConfig({ mode: "repository", repo: "a/b", commits: 8, pulls: 2 })).toBeNull();
		expect(validateGithubConfig({ mode: "repository", repo: "a/b", commits: 8, pulls: 3 })).toContain("10 rows");
	});
});
