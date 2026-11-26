export const GITHUB_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

export const GITHUB_TOKEN_PERMISSIONS = [
	{ scope: "Repository", name: "Metadata", usage: "Read stars, forks and owners" },
	{ scope: "Repository", name: "Contents", usage: "List the latest commits" },
	{ scope: "Repository", name: "Pull requests", usage: "List open pull requests" },
	{ scope: "Account", name: "Starring", usage: "Follow releases of the repos you star" },
	{ scope: "Account", name: "Watching", usage: "Follow releases of the repos you watch" },
] as const;

export const GITHUB_USERNAME_PATTERN = "^[a-zA-Z\\d](?:[a-zA-Z\\d]|-(?=[a-zA-Z\\d])){0,38}$";

export type GithubConfig = { mode: "contributions"; username: string };
export type GithubMode = GithubConfig["mode"];

export const GITHUB_MODES = {
	contributions: { label: "Contributions", refresh: "Daily", needsToken: false },
} as const satisfies Record<GithubMode, { label: string; refresh: "Daily" | "Hourly"; needsToken: boolean }>;

const HOUR_MS = 60 * 60 * 1000;
// The scheduler ticks every few minutes; the slack keeps hourly pushes from slipping a tick each hour
const HOURLY_SLACK_MS = 5 * 60 * 1000;

export function isScheduleDue(mode: GithubMode, lastPushedAt: Date | null, now = new Date()) {
	if (!lastPushedAt) return true;
	if (GITHUB_MODES[mode].refresh === "Daily") return lastPushedAt.toDateString() !== now.toDateString();
	return now.getTime() - lastPushedAt.getTime() >= HOUR_MS - HOURLY_SLACK_MS;
}

/** Cross-field rules the request schema cannot express; returns a user-facing message when invalid. */
export function validateGithubConfig(_config: GithubConfig): string | null {
	return null;
}
