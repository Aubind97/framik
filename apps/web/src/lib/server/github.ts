export type ContributionDay = { date: string; count: number; level: number };
export type ContributionStats = { total: number; currentStreak: number; longestStreak: number };

export const GITHUB_USERNAME_PATTERN = "^[a-zA-Z\\d](?:[a-zA-Z\\d]|-(?=[a-zA-Z\\d])){0,38}$";

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
