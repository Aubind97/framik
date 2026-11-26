import { githubGraphql } from "#lib/server/github-api.ts";
import { avatarImage, fetchAvatar, fitText, formatAge, HEIGHT, INK, svgDocument, WIDTH } from "#lib/server/svg.ts";

export type Release = { repo: string; tag: string; lines: string[]; date: string; avatar: string | null };

type RepositoryRelease = {
	nameWithOwner: string;
	owner: { avatarUrl: string };
	latestRelease: { tagName: string; name: string | null; description: string | null; publishedAt: string } | null;
};

// ponytail: only the 100 most recently starred and 100 watched repos are scanned; paginate if feeds look incomplete
const RELEASES_QUERY = `query {
	viewer {
		starredRepositories(first: 100, orderBy: { field: STARRED_AT, direction: DESC }) { nodes { ...release } }
		watching(first: 100) { nodes { ...release } }
	}
}
fragment release on Repository {
	nameWithOwner
	owner { avatarUrl(size: 88) }
	latestRelease { tagName name description publishedAt }
}`;

const CARDS = 5;

/** Plain-text lines of release notes, without markdown syntax or blank lines. */
export function releaseNoteLines(markdown: string | null): string[] {
	return (markdown ?? "")
		.split("\n")
		.map((line) =>
			line
				.replace(/<[^>]+>/g, "")
				.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
				.replace(/^[\s>#*+-]+/, "")
				.replace(/[*_`~]/g, "")
				.trim(),
		)
		.filter((line) => line && !/^\[![A-Z]+\]$/.test(line));
}

export async function fetchReleases(token: string): Promise<Release[]> {
	const { viewer } = await githubGraphql<{ viewer: { starredRepositories: { nodes: RepositoryRelease[] }; watching: { nodes: RepositoryRelease[] } } }>(token, RELEASES_QUERY);

	const released = new Map<string, RepositoryRelease & { latestRelease: NonNullable<RepositoryRelease["latestRelease"]> }>();
	for (const repository of [...viewer.starredRepositories.nodes, ...viewer.watching.nodes]) {
		if (repository.latestRelease) released.set(repository.nameWithOwner, { ...repository, latestRelease: repository.latestRelease });
	}

	const latest = [...released.values()].sort((a, b) => b.latestRelease.publishedAt.localeCompare(a.latestRelease.publishedAt)).slice(0, CARDS);
	return Promise.all(
		latest.map(async ({ nameWithOwner, owner, latestRelease: release }) => {
			const version = release.tagName.replace(/^v/, "");
			// Changelog headings like "0.48.0 (2026-11-26)" only repeat the tag
			const lines = [release.name?.trim() ?? "", ...releaseNoteLines(release.description)].filter((line) => line && !line.replace(/^v/, "").startsWith(version));
			return { repo: nameWithOwner, tag: release.tagName, lines: lines.slice(0, 2), date: release.publishedAt, avatar: await fetchAvatar(owner.avatarUrl) };
		}),
	);
}

const PAD = 32;
const CARD_HEIGHT = 90;
const AVATAR = 44;

export function renderReleasesSvg(releases: Release[], now = new Date()): string {
	if (releases.length === 0) {
		return svgDocument(`<text x="${WIDTH / 2}" y="${HEIGHT / 2}" font-size="20" text-anchor="middle">No releases from your starred or watched repositories</text>`);
	}

	const textX = PAD + AVATAR + 16;
	const textWidth = WIDTH - PAD - textX;
	const cards = releases.map((release, index) => {
		const top = 16 + index * CARD_HEIGHT;
		const rule = index < releases.length - 1 ? `<rect x="${PAD}" y="${top + CARD_HEIGHT - 2}" width="${WIDTH - PAD * 2}" height="1"/>` : "";
		return [
			avatarImage(`avatar-${index}`, release.avatar, PAD, top + 8, AVATAR),
			`<text x="${textX}" y="${top + 26}" font-size="20"><tspan font-weight="bold" fill="${INK.blue}">${fitText(release.repo, 20, 420)}</tspan><tspan dx="12" font-size="18" fill="${INK.green}">${fitText(release.tag, 18, 180)}</tspan></text>`,
			`<text x="${WIDTH - PAD}" y="${top + 26}" font-size="16" text-anchor="end">${formatAge(release.date, now)}</text>`,
			...release.lines.map((line, row) => `<text x="${textX}" y="${top + 52 + row * 22}" font-size="16">${fitText(line, 16, textWidth)}</text>`),
			rule,
		].join("");
	});

	return svgDocument(cards.join("\n"));
}
