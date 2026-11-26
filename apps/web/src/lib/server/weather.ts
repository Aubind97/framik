import { fitText, HEIGHT, INK, svgDocument, USER_AGENT, WIDTH } from "#lib/server/svg.ts";
import type { WeatherConfig, WeatherLocation } from "#lib/weather.ts";

export type Forecast = {
	current: { time: string; temperature_2m: number; apparent_temperature: number; weather_code: number; is_day: number };
	hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: (number | null)[] };
	daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
};

type Sky = "clear" | "partly" | "cloudy" | "fog" | "rain" | "snow" | "storm";

const SANS = "DejaVu Sans";
const HOURS = 24;

async function openMeteo<T>(url: string): Promise<T> {
	const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "error", signal: AbortSignal.timeout(15_000) });
	if (!response.ok) throw new Error(`Open-Meteo answered ${response.status}`);
	return response.json() as Promise<T>;
}

export async function searchLocations(query: string): Promise<WeatherLocation[]> {
	const params = new URLSearchParams({ name: query, count: "8", language: "en", format: "json" });
	const { results = [] } = await openMeteo<{
		results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }[];
	}>(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
	return results.map(({ name, admin1, country, latitude, longitude }) => ({ name, region: admin1 ?? "", country: country ?? "", latitude, longitude }));
}

export function fetchForecast(config: WeatherConfig): Promise<Forecast> {
	const params = new URLSearchParams({
		latitude: String(config.latitude),
		longitude: String(config.longitude),
		current: "temperature_2m,apparent_temperature,weather_code,is_day",
		hourly: "temperature_2m,precipitation_probability",
		daily: "weather_code,temperature_2m_max,temperature_2m_min",
		timezone: "auto",
		forecast_days: "7",
		temperature_unit: config.unit,
	});
	return openMeteo<Forecast>(`https://api.open-meteo.com/v1/forecast?${params}`);
}

/** Groups WMO weather codes into the skies we draw an icon for. */
export function skyOf(code: number): Sky {
	if (code <= 1) return "clear";
	if (code === 2) return "partly";
	if (code === 3) return "cloudy";
	if (code === 45 || code === 48) return "fog";
	if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
	if (code >= 95) return "storm";
	return "rain";
}

// Open-Meteo returns the place's wall time without an offset: read and format it as UTC so the server's zone never applies
const wallTime = (time: string) => new Date(`${time}Z`);

// Greys dither into coloured noise on the six inks, so shading uses ink dots aligned to the panel's pixels
const SHADES: Record<string, { tile: number; dots: [number, number, string][] }> = {
	light: {
		tile: 4,
		dots: [
			[0, 0, INK.blue],
			[2, 2, INK.blue],
		],
	},
	mid: { tile: 2, dots: [[0, 0, INK.blue]] },
	grey: { tile: 2, dots: [[0, 0, INK.black]] },
	dark: {
		tile: 2,
		dots: [
			[0, 0, INK.black],
			[1, 1, INK.blue],
		],
	},
	glow: {
		tile: 2,
		dots: [
			[0, 0, INK.yellow],
			[1, 1, INK.yellow],
		],
	},
};
type Shade = keyof typeof SHADES;
// Scales the renderer can tile exactly; other sizes blur the dot patterns into grey
export const ICON_SIZES = { current: 125, big: 200, day: 80 } as const;

export function iconDefs() {
	const patterns = Object.values(ICON_SIZES).flatMap((size) =>
		Object.entries(SHADES).map(([name, { tile, dots }]) => {
			const rects = dots.map(([x, y, ink]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="${ink}"/>`).join("");
			return `<pattern id="shade-${name}-${size}" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse" patternTransform="scale(${100 / size})" shape-rendering="crispEdges">${rects}</pattern>`;
		}),
	);
	return [
		"<defs>",
		...patterns,
		`<radialGradient id="sun" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="${INK.yellow}"/><stop offset="0.55" stop-color="#ffc21a"/><stop offset="1" stop-color="#f07800"/></radialGradient>`,
		`<radialGradient id="moon" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="${INK.white}"/><stop offset="1" stop-color="${INK.yellow}"/></radialGradient>`,
		"</defs>",
	].join("");
}

type Pen = { id: string; size: number };
const CLOUD = "M22 64 A16 16 0 0 1 20 32 A27 27 0 0 1 70 25 A20 20 0 0 1 78 64 Z";

/** A cloud lit from above: white top, then bands of denser dots towards its base. */
function cloud(pen: Pen, index: number, dx: number, dy: number, scale: number, bands: [number, Shade][]) {
	const id = `${pen.id}-${index}`;
	const shape = `d="${CLOUD}" transform="translate(${dx} ${dy}) scale(${scale})"`;
	const shading = bands.map(
		([from, shade]) => `<rect x="${dx}" y="${dy + from * scale}" width="${100 * scale}" height="${(70 - from) * scale}" fill="url(#shade-${shade}-${pen.size})"/>`,
	);
	return [
		`<clipPath id="${id}"><path ${shape}/></clipPath>`,
		`<path ${shape} fill="${INK.white}"/>`,
		`<g clip-path="url(#${id})">${shading.join("")}</g>`,
		`<path ${shape} fill="none" stroke="${INK.black}" stroke-width="${(1.6 * 100) / pen.size / scale}"/>`,
	].join("");
}
const LIGHT: [number, Shade][] = [
	[30, "light"],
	[48, "mid"],
];
const DARK: [number, Shade][] = [
	[0, "grey"],
	[36, "dark"],
];

const sun = (pen: Pen, cx: number, cy: number, r: number) =>
	`<circle cx="${cx}" cy="${cy}" r="${r + 9}" fill="url(#shade-glow-${pen.size})"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sun)"/>`;
const moon = (pen: Pen, dx: number, dy: number, scale: number) =>
	`<path d="M62 18 A34 34 0 1 0 84 56 A27 27 0 0 1 62 18 Z" transform="translate(${dx} ${dy}) scale(${scale})" fill="url(#moon)" stroke="${INK.black}" stroke-width="${(1.6 * 100) / pen.size / scale}"/>`;
const drops = (xs: number[], y: number) =>
	xs
		.map(
			(x) =>
				`<path d="M${x} ${y} C${x + 2} ${y + 5} ${x + 6} ${y + 8} ${x + 6} ${y + 12} A6 6 0 0 1 ${x - 6} ${y + 12} C${x - 6} ${y + 8} ${x - 2} ${y + 5} ${x} ${y} Z" fill="${INK.blue}"/>`,
		)
		.join("");
const flakes = (points: [number, number][]) =>
	`<path d="${points.map(([x, y]) => `M${x - 6} ${y} H${x + 6} M${x - 3} ${y - 5.2} L${x + 3} ${y + 5.2} M${x - 3} ${y + 5.2} L${x + 3} ${y - 5.2}`).join(" ")}" stroke="${INK.blue}" stroke-width="3" stroke-linecap="round"/>`;

const ICONS: Record<Sky, (isDay: boolean, pen: Pen) => string> = {
	clear: (isDay, pen) => (isDay ? sun(pen, 50, 50, 28) : moon(pen, 0, 0, 1)),
	partly: (isDay, pen) => `${isDay ? sun(pen, 62, 36, 21) : moon(pen, 30, 2, 0.65)}${cloud(pen, 0, -2, 26, 0.88, LIGHT)}`,
	cloudy: (_, pen) => `${cloud(pen, 0, 26, 6, 0.72, DARK)}${cloud(pen, 1, -2, 28, 0.92, LIGHT)}`,
	fog: (_, pen) => `${cloud(pen, 0, 4, 0, 0.92, LIGHT)}<path d="M18 76 H82 M28 90 H72" stroke="url(#shade-dark-${pen.size})" stroke-width="7" stroke-linecap="round"/>`,
	rain: (_, pen) => `${cloud(pen, 0, 4, -2, 0.92, DARK)}${drops([32, 52, 72], 68)}`,
	snow: (_, pen) =>
		`${cloud(pen, 0, 4, -2, 0.92, LIGHT)}${flakes([
			[30, 80],
			[52, 88],
			[74, 80],
		])}`,
	storm: (_, pen) =>
		`${cloud(pen, 0, 4, -2, 0.92, DARK)}<path d="M54 50 L38 77 H51 L43 98 L68 66 H55 L63 50 Z" fill="url(#sun)" stroke="${INK.black}" stroke-width="1.5" stroke-linejoin="round"/>`,
};

/** A weather icon drawn on a 100-unit square at (x, y); `size` must be one of ICON_SIZES, whose patterns iconDefs() declares. */
export function weatherIcon(code: number, isDay: boolean, x: number, y: number, size: number) {
	// Whole-pixel origin keeps the dot patterns on the panel's pixel grid
	const [left, top] = [Math.round(x), Math.round(y)];
	return `<g transform="translate(${left} ${top}) scale(${size / 100})">${ICONS[skyOf(code)](isDay, { id: `icon-${left}-${top}`, size })}</g>`;
}

const degrees = (value: number) => `${Math.round(value)}°`;
const text = (x: number, y: number, size: number, content: string, extra = "") => `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}"${extra}>${content}</text>`;

function currentBlock(config: WeatherConfig, current: Forecast["current"], top: number, scale: number) {
	const iconSize = scale > 1 ? ICON_SIZES.big : ICON_SIZES.current;
	const textX = WIDTH / 2 - 20 * scale;
	return [
		weatherIcon(current.weather_code, current.is_day === 1, textX - iconSize - 30 * scale, top, iconSize),
		text(textX, top + 88 * scale, 80 * scale, degrees(current.temperature_2m), ` font-weight="bold"`),
		text(textX + 2, top + 126 * scale, 22 * scale, `Feels like ${degrees(current.apparent_temperature)}${config.unit === "fahrenheit" ? "F" : "C"}`),
	].join("");
}

function dayCards({ daily }: Forecast, locale: string, top: number) {
	const gap = 10;
	const left = 24;
	const width = (WIDTH - 2 * left - 6 * gap) / 7;
	return daily.time
		.slice(0, 7)
		.map((day, index) => {
			const x = left + index * (width + gap);
			const center = x + width / 2;
			const name = index === 0 ? "Today" : wallTime(day).toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" });
			return [
				`<rect x="${x}" y="${top}" width="${width}" height="${HEIGHT - top - 20}" rx="12" fill="none" stroke="${INK.black}" stroke-width="2"/>`,
				index === 0 ? `<rect x="${x + 8}" y="${top + 10}" width="${width - 16}" height="30" rx="15" fill="${INK.yellow}"/>` : "",
				text(center, top + 32, 20, name, ` font-weight="bold" text-anchor="middle"`),
				weatherIcon(daily.weather_code[index] ?? 0, true, center - ICON_SIZES.day / 2, top + 46, ICON_SIZES.day),
				text(center, top + 164, 26, degrees(daily.temperature_2m_max[index] ?? 0), ` font-weight="bold" text-anchor="middle" fill="${INK.red}"`),
				text(center, top + 194, 20, degrees(daily.temperature_2m_min[index] ?? 0), ` text-anchor="middle" fill="${INK.blue}"`),
			].join("");
		})
		.join("");
}

function hourlyChart({ current, hourly }: Forecast, locale: string, top: number) {
	const start = Math.max(
		0,
		hourly.time.findIndex((time) => time >= `${current.time.slice(0, 13)}:00`),
	);
	const times = hourly.time.slice(start, start + HOURS + 1);
	const temperatures = hourly.temperature_2m.slice(start, start + HOURS + 1);
	const rain = hourly.precipitation_probability.slice(start, start + HOURS + 1);
	const chart = { left: 40, right: WIDTH - 72, top: top + 30, bottom: HEIGHT - 54 };
	const step = (chart.right - chart.left) / HOURS;
	const low = Math.min(...temperatures);
	const high = Math.max(...temperatures);
	const x = (index: number) => chart.left + index * step;
	// Keep the line in the upper part so labels stay clear of the rain bars' baseline
	const y = (value: number) => chart.bottom - 30 - ((value - low) / Math.max(1, high - low)) * (chart.bottom - chart.top - 50);
	const barY = (probability: number) => chart.bottom - (probability / 100) * (chart.bottom - chart.top);

	const bars = rain
		.map((probability, index) =>
			probability
				? `<rect x="${(x(index) - step * 0.35).toFixed(1)}" y="${barY(probability).toFixed(1)}" width="${(step * 0.7).toFixed(1)}" height="${(chart.bottom - barY(probability)).toFixed(1)}" fill="${INK.blue}"/>`
				: "",
		)
		.join("");
	const line = temperatures.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(" ");
	const labels = times
		.map((time, index) => {
			if (index % 3) return "";
			const hour = wallTime(time).toLocaleTimeString(locale, locale === "en-GB" ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC" } : { hour: "numeric", timeZone: "UTC" });
			const value = temperatures[index] ?? 0;
			return [
				`<circle cx="${x(index)}" cy="${y(value)}" r="6" fill="${INK.white}" stroke="${INK.red}" stroke-width="4"/>`,
				text(x(index), y(value) - 14, 18, degrees(value), ` font-weight="bold" text-anchor="middle"`),
				text(x(index), chart.bottom + 24, 16, index === 0 ? "Now" : hour, ` text-anchor="middle"`),
			].join("");
		})
		.join("");
	const rainy = rain.some((probability) => probability);
	const axis = (rainy ? [100, 50, 0] : [0])
		.map((probability) => {
			const dash = probability ? ` stroke-dasharray="2 5"` : "";
			return `<line x1="${chart.left - 16}" x2="${chart.right + 16}" y1="${barY(probability)}" y2="${barY(probability)}" stroke="${INK.black}" shape-rendering="crispEdges"${dash}/>${rainy ? text(chart.right + 22, barY(probability) + 5, 14, `${probability} %`) : ""}`;
		})
		.join("");

	return `${axis}${bars}<path d="${line}" fill="none" stroke="${INK.red}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${labels}`;
}

export function renderWeatherSvg(config: WeatherConfig, forecast: Forecast): string {
	const locale = config.unit === "fahrenheit" ? "en-US" : "en-GB";
	const title = config.region && config.region !== config.name ? `${config.name}, ${config.region}` : config.name;
	const date = wallTime(forecast.current.time).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
	const big = config.forecast === "none";

	return svgDocument(
		[
			iconDefs(),
			text(WIDTH / 2, 50, 34, fitText(title, 36, WIDTH - 64), ` font-weight="bold" text-anchor="middle"`),
			text(WIDTH / 2, 80, 20, date, ` text-anchor="middle"`),
			currentBlock(config, forecast.current, big ? 160 : 100, big ? 1.6 : 1),
			config.forecast === "days" ? dayCards(forecast, locale, 250) : "",
			config.forecast === "hours" ? hourlyChart(forecast, locale, 240) : "",
		].join(""),
	);
}
