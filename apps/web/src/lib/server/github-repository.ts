import type { GithubConfig } from "#lib/github.ts";
import { githubGraphql } from "#lib/server/github-api.ts";
import { avatarImage, fetchAvatar, fitText, formatAge, INK, monoWidth, svgDocument, WIDTH } from "#lib/server/svg.ts";

export type RepositoryActivity = {
	name: string;
	stars: number;
	forks: number;
	avatar: string | null;
	commits: { message: string; date: string }[];
	pulls: { title: string; date: string }[] | null;
	openPulls: number;
};

type RepositoryResponse = {
	repository: {
		nameWithOwner: string;
		stargazerCount: number;
		forkCount: number;
		owner: { avatarUrl: string };
		defaultBranchRef: { target: { history?: { nodes: { messageHeadline: string; committedDate: string }[] } } } | null;
		pullRequests: { totalCount: number; nodes: { title: string; createdAt: string }[] };
	} | null;
};

const REPOSITORY_QUERY = `query($owner: String!, $name: String!, $commits: Int!, $pulls: Int!) {
	repository(owner: $owner, name: $name) {
		nameWithOwner stargazerCount forkCount
		owner { avatarUrl(size: 112) }
		defaultBranchRef { target { ... on Commit { history(first: $commits) { nodes { messageHeadline committedDate } } } } }
		pullRequests(states: OPEN, first: $pulls, orderBy: { field: CREATED_AT, direction: DESC }) { totalCount nodes { title createdAt } }
	}
}`;

export async function fetchRepositoryActivity(token: string, config: Extract<GithubConfig, { mode: "repository" }>): Promise<RepositoryActivity> {
	const [owner, name] = config.repo.split("/");
	const { repository } = await githubGraphql<RepositoryResponse>(token, REPOSITORY_QUERY, { owner, name, commits: config.commits, pulls: config.pulls });
	if (!repository) throw new Error(`Repository "${config.repo}" was not found, or the token cannot read it`);

	return {
		name: repository.nameWithOwner,
		stars: repository.stargazerCount,
		forks: repository.forkCount,
		avatar: await fetchAvatar(repository.owner.avatarUrl),
		commits: (repository.defaultBranchRef?.target.history?.nodes ?? []).map((commit) => ({ message: commit.messageHeadline, date: commit.committedDate })),
		pulls: config.pulls > 0 ? repository.pullRequests.nodes.map((pull) => ({ title: pull.title, date: pull.createdAt })) : null,
		openPulls: repository.pullRequests.totalCount,
	};
}

const PAD = 32;
const FONT = 18;
const LINE = 26;
// Ages are at most 4 characters ("11mo")
const AGE_WIDTH = monoWidth(4, FONT) + 12;

export function renderRepositorySvg(activity: RepositoryActivity, now = new Date()): string {
	const textX = PAD + AGE_WIDTH;
	const textWidth = WIDTH - PAD - textX;
	const parts: string[] = [
		avatarImage("avatar", activity.avatar, PAD, 24, 56),
		`<text x="${PAD + 72}" y="52" font-size="28" font-weight="bold" fill="${INK.blue}">${fitText(activity.name, 28, WIDTH - PAD * 2 - 72)}</text>`,
		`<text x="${PAD + 72}" y="80" font-size="${FONT}">★ ${activity.stars.toLocaleString("en")} stars · ${activity.forks.toLocaleString("en")} forks</text>`,
	];

	let y = 104;
	const rule = () => parts.push(`<rect x="${PAD}" y="${y}" width="${WIDTH - PAD * 2}" height="2"/>`);
	const section = (title: string, rows: { text: string; date: string }[], empty: string) => {
		rule();
		y += 34;
		parts.push(`<text x="${PAD}" y="${y}" font-size="${FONT}" font-weight="bold">${title}</text>`);
		if (rows.length === 0) {
			y += LINE;
			parts.push(`<text x="${PAD}" y="${y}" font-size="${FONT}">${empty}</text>`);
		}
		for (const row of rows) {
			y += LINE;
			parts.push(
				`<text x="${PAD}" y="${y}" font-size="${FONT}" fill="${INK.green}">${formatAge(row.date, now)}</text>`,
				`<text x="${textX}" y="${y}" font-size="${FONT}">${fitText(row.text, FONT, textWidth)}</text>`,
			);
		}
		y += 18;
	};

	section(
		`Last ${activity.commits.length} commits`,
		activity.commits.map((commit) => ({ text: commit.message, date: commit.date })),
		"No commits yet",
	);
	if (activity.pulls) {
		section(
			`Open pull requests <tspan fill="${INK.red}">(${activity.openPulls} total)</tspan>`,
			activity.pulls.map((pull) => ({ text: pull.title, date: pull.date })),
			"No open pull requests",
		);
	}

	return svgDocument(parts.join("\n"));
}
