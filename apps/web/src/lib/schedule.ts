import { GITHUB_MODES, type GithubConfig } from "#lib/github.ts";
import type { PresidentialConfig } from "#lib/presidential.ts";

export type ScheduledWidget = { widget: "github"; config: GithubConfig } | { widget: "presidential_2027"; config: PresidentialConfig };
export type Refresh = "Daily" | "Hourly";

export function scheduleRefresh(schedule: ScheduledWidget): Refresh {
	return schedule.widget === "github" ? GITHUB_MODES[schedule.config.mode].refresh : "Daily";
}

const HOUR_MS = 60 * 60 * 1000;
// The scheduler ticks every few minutes; the slack keeps hourly pushes from slipping a tick each hour
const HOURLY_SLACK_MS = 5 * 60 * 1000;

export function isScheduleDue(refresh: Refresh, lastPushedAt: Date | null, now = new Date()) {
	if (!lastPushedAt) return true;
	if (refresh === "Daily") return lastPushedAt.toDateString() !== now.toDateString();
	return now.getTime() - lastPushedAt.getTime() >= HOUR_MS - HOURLY_SLACK_MS;
}
