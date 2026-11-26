import { describe, expect, test } from "bun:test";
import type { WeatherConfig } from "#lib/weather.ts";
import { type Forecast, renderWeatherSvg, skyOf } from "./weather.ts";

const hours = Array.from({ length: 48 }, (_, hour) => `2026-11-${26 + Math.floor(hour / 24)}T${String(hour % 24).padStart(2, "0")}:00`);
const FORECAST: Forecast = {
	current: { time: "2026-11-26T16:45", temperature_2m: 4.6, apparent_temperature: 1.4, weather_code: 61, is_day: 1 },
	hourly: {
		time: hours,
		temperature_2m: hours.map((_, hour) => hour),
		precipitation_probability: hours.map((_, hour) => (hour === 18 ? 80 : 0)),
	},
	daily: {
		time: ["26", "27", "28", "29", "30"].map((day) => `2026-11-${day}`).concat(["2026-12-01", "2026-12-02"]),
		weather_code: [61, 0, 2, 3, 45, 71, 95],
		temperature_2m_max: [6.4, 4, 4, 10, 6, 5, 9],
		temperature_2m_min: [1, 0, 0, 4, -1.4, 2, 4],
	},
};
const CONFIG: WeatherConfig = { name: "Paris", region: "Île-de-France", country: "France", latitude: 48.85, longitude: 2.35, unit: "celsius", forecast: "days" };

describe("skyOf", () => {
	test("groups WMO codes", () => {
		expect([0, 1, 2, 3, 45, 53, 66, 81, 73, 86, 95, 99].map(skyOf)).toEqual([
			"clear",
			"clear",
			"partly",
			"cloudy",
			"fog",
			"rain",
			"rain",
			"rain",
			"snow",
			"snow",
			"storm",
			"storm",
		]);
	});
});

describe("renderWeatherSvg", () => {
	test("shows the place's local date and the current temperature", () => {
		const svg = renderWeatherSvg({ ...CONFIG, forecast: "none" }, FORECAST);
		expect(svg).toContain("Paris, Île-de-France");
		expect(svg).toContain("Thursday 26 November");
		expect(svg).toContain(">5°<");
		expect(svg).toContain("Feels like 1°C");
	});

	test("days lists 7 cards starting today", () => {
		const svg = renderWeatherSvg(CONFIG, FORECAST);
		expect(svg).toContain(">Today<");
		expect(svg).toContain(">Wed<");
		expect(svg).toContain(">-1°<");
	});

	test("hours starts at the current hour and draws rain bars only where rain is likely", () => {
		const svg = renderWeatherSvg({ ...CONFIG, forecast: "hours" }, FORECAST);
		expect(svg).toContain(">Now<");
		expect(svg).toContain(">16°<");
		expect(svg).toContain(">19:00<");
		expect(svg.match(/<rect(?![^>]*width="1")[^>]*fill="#6440ff"/g)?.length).toBe(1);
		expect(svg).toContain("100 %");
	});

	test("uses a 12-hour clock with Fahrenheit", () => {
		const svg = renderWeatherSvg({ ...CONFIG, unit: "fahrenheit", forecast: "hours" }, FORECAST);
		expect(svg).toContain("Thursday, November 26");
		expect(svg).toContain(">7 PM<");
		expect(svg).toContain("Feels like 1°F");
	});
});
