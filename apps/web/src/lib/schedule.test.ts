import { describe, expect, test } from "bun:test";
import { isScheduleDue, scheduleRefresh } from "./schedule.ts";

describe("isScheduleDue", () => {
	const at = (time: string) => new Date(`2026-11-26T${time}`);

	test("a schedule that never pushed is due", () => {
		expect(isScheduleDue("Daily", null)).toBe(true);
	});

	test("daily schedules push once per local day", () => {
		expect(isScheduleDue("Daily", at("00:10:00"), at("23:50:00"))).toBe(false);
		expect(isScheduleDue("Daily", new Date(2026, 10, 25, 23, 50), new Date(2026, 10, 26, 0, 5))).toBe(true);
	});

	test("hourly schedules are due again after about an hour", () => {
		const last = at("10:00:00");
		expect(isScheduleDue("Hourly", last, at("10:30:00"))).toBe(false);
		expect(isScheduleDue("Hourly", last, at("10:56:00"))).toBe(true);
	});
});

describe("scheduleRefresh", () => {
	test("follows the GitHub mode, and presidential is daily, weather hourly", () => {
		expect(scheduleRefresh({ widget: "github", config: { mode: "releases" } })).toBe("Hourly");
		expect(scheduleRefresh({ widget: "github", config: { mode: "contributions", username: "a", icon: "github" } })).toBe("Daily");
		expect(scheduleRefresh({ widget: "presidential_2027", config: { mode: "trend" } })).toBe("Daily");
		expect(
			scheduleRefresh({ widget: "weather", config: { name: "Paris", region: "", country: "France", latitude: 48.85, longitude: 2.35, unit: "celsius", forecast: "none" } }),
		).toBe("Hourly");
	});
});
