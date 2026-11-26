export const GITHUB_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

export const GITHUB_TOKEN_PERMISSIONS = [
	{ scope: "Repository", name: "Metadata", usage: "Read stars, forks and owners" },
	{ scope: "Repository", name: "Contents", usage: "List the latest commits" },
	{ scope: "Repository", name: "Pull requests", usage: "List open pull requests" },
	{ scope: "Account", name: "Starring", usage: "Follow releases of the repos you star" },
	{ scope: "Account", name: "Watching", usage: "Follow releases of the repos you watch" },
] as const;
