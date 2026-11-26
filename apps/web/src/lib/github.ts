export const GITHUB_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";
export const GITHUB_CLASSIC_TOKEN_URL = "https://github.com/settings/tokens/new?scopes=repo&description=Framik";

export const GITHUB_TOKEN_PERMISSIONS = [
	{ scope: "Repository", name: "Metadata", usage: "Read stars, forks and owners" },
	{ scope: "Repository", name: "Contents", usage: "List the latest commits" },
	{ scope: "Repository", name: "Pull requests", usage: "List open pull requests" },
	{ scope: "Account", name: "Starring", usage: "Follow releases of the repos you star" },
	{ scope: "Account", name: "Watching", usage: "Follow releases of the repos you watch" },
] as const;

export const GITHUB_USERNAME_PATTERN = "^[a-zA-Z\\d](?:[a-zA-Z\\d]|-(?=[a-zA-Z\\d])){0,38}$";

export const GITHUB_REPO_PATTERN = "^[a-zA-Z\\d-]+/[\\w.-]+$";

// What fits under the repository header at 800×480
export const REPOSITORY_LIMITS = { commits: 8, pulls: 6, rows: 10 } as const;

export type GithubConfig =
	| { mode: "contributions"; username: string; icon: "github" | "avatar" }
	| { mode: "repository"; repo: string; commits: number; pulls: number }
	| { mode: "releases" };
export type GithubMode = GithubConfig["mode"];

export const GITHUB_MODES = {
	contributions: { label: "Contributions", refresh: "Daily", needsToken: false },
	repository: { label: "Repository activity", refresh: "Hourly", needsToken: true },
	releases: { label: "Releases feed", refresh: "Hourly", needsToken: true },
} as const satisfies Record<GithubMode, { label: string; refresh: "Daily" | "Hourly"; needsToken: boolean }>;

/** Cross-field rules the request schema cannot express; returns a user-facing message when invalid. */
export function validateGithubConfig(config: GithubConfig): string | null {
	if (config.mode === "repository" && config.commits + config.pulls > REPOSITORY_LIMITS.rows) {
		return `Commits and pull requests together cannot exceed ${REPOSITORY_LIMITS.rows} rows`;
	}
	return null;
}
