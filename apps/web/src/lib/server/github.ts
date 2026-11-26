import { avatarImage, fetchAvatar } from "#lib/server/svg.ts";

export type ContributionDay = { date: string; count: number; level: number };
export type ContributionStats = { total: number; currentStreak: number; longestStreak: number };

const REQUEST_TIMEOUT_MS = 15_000;

const attr = (tag: string, name: string) => tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];

export function parseContributions(html: string): ContributionDay[] {
	const counts = new Map<string, number>();
	for (const [, tag, text] of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
		const id = attr(tag, "for");
		if (id) counts.set(id, Number(text.match(/^([\d,]+) contribution/)?.[1].replaceAll(",", "") ?? 0));
	}

	const days: ContributionDay[] = [];
	for (const [tag] of html.matchAll(/<td\b[^>]*\sdata-date="[^"]*"[^>]*>/g)) {
		const date = attr(tag, "data-date");
		const id = attr(tag, "id");
		if (!date) continue;
		days.push({ date, level: Number(attr(tag, "data-level") ?? 0), count: (id && counts.get(id)) || 0 });
	}
	return days.sort((a, b) => a.date.localeCompare(b.date));
}

export function getContributionStats(days: ContributionDay[]): ContributionStats {
	let total = 0;
	let run = 0;
	let longestStreak = 0;
	for (const { count } of days) {
		total += count;
		run = count > 0 ? run + 1 : 0;
		longestStreak = Math.max(longestStreak, run);
	}

	// Today without contributions yet does not break the streak
	let currentStreak = 0;
	for (let i = days.length - 1; i >= 0; i--) {
		if (days[i].count > 0) currentStreak++;
		else if (i < days.length - 1) break;
	}
	return { total, currentStreak, longestStreak };
}

export async function fetchContributions(username: string): Promise<ContributionDay[]> {
	const response = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
		redirect: "error",
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	if (!response.ok) throw new Error(`GitHub responded ${response.status} for "${username}"`);

	const days = parseContributions(await response.text());
	if (days.length === 0) throw new Error(`No contributions found for "${username}"`);
	return days;
}

const WIDTH = 800;
const HEIGHT = 480;
const CELL = 12;
const PITCH = 14;
const LEVEL_COLORS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const GITHUB_MARK =
	"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

const utcDate = (date: string) => new Date(`${date}T00:00:00Z`);

// username must already match GITHUB_USERNAME_PATTERN (#lib/github.ts): it is inlined in the SVG unescaped
export function renderContributionsSvg(username: string, days: ContributionDay[], avatar: string | null = null): string {
	const { total, currentStreak, longestStreak } = getContributionStats(days);
	const firstWeekday = days.length ? utcDate(days[0].date).getUTCDay() : 0;
	const weeks = Math.ceil((days.length + firstWeekday) / 7);
	const gridX = (WIDTH - weeks * PITCH + (PITCH - CELL)) / 2;
	const gridY = 345;
	// ponytail: title width estimated at ~17px per DejaVu character; measure with a font lib if centring looks off
	const avatarWidth = avatar ? 62 : 0;
	const avatarX = (WIDTH - avatarWidth - 50 - `GitHub/${username}`.length * 17) / 2;
	const titleX = avatarX + avatarWidth;

	const cells: string[] = [];
	const months: string[] = [];
	let lastLabelWeek = Number.NEGATIVE_INFINITY;
	days.forEach(({ date, level }, i) => {
		const week = Math.floor((i + firstWeekday) / 7);
		const weekday = (i + firstWeekday) % 7;
		cells.push(`<rect x="${gridX + week * PITCH}" y="${gridY + weekday * PITCH}" width="${CELL}" height="${CELL}" rx="2" fill="${LEVEL_COLORS[level] ?? LEVEL_COLORS[0]}"/>`);

		const day = utcDate(date);
		if (day.getUTCDate() === 1 && week - lastLabelWeek >= 3) {
			lastLabelWeek = week;
			const month = day.toLocaleString("en", { month: "short", timeZone: "UTC" });
			months.push(`<text x="${gridX + week * PITCH}" y="${gridY - 10}" font-size="14">${month}</text>`);
		}
	});

	const stat = (x: number, label: string, value: number) =>
		`<text x="${x}" y="170" font-size="24" text-anchor="middle">${label}</text><text x="${x}" y="245" font-size="64" text-anchor="middle">${value}</text>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="DejaVu Sans, sans-serif" fill="#000">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
${avatarImage("avatar", avatar, avatarX, 42, 48)}
<g transform="translate(${titleX} 48) scale(2.5)"><path d="${GITHUB_MARK}"/></g>
<text x="${titleX + 50}" y="84" font-size="36">GitHub/${username}</text>
${stat(WIDTH / 6, "Contributions", total)}
${stat(WIDTH / 2, "Current Streak", currentStreak)}
${stat((WIDTH * 5) / 6, "Longest Streak", longestStreak)}
${months.join("\n")}
${cells.join("\n")}
</svg>`;
}

export const fetchUserAvatar = (username: string) => fetchAvatar(`https://avatars.githubusercontent.com/${encodeURIComponent(username)}?s=96`);
