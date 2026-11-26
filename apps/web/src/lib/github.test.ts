import { describe, expect, test } from "bun:test";
import { isScheduleDue } from "./github.ts";

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
