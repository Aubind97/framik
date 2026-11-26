import { applyDitheringNode, toMeasuredColorsNode } from "@framik/shared/node";
import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { GITHUB_REPO_PATTERN, GITHUB_USERNAME_PATTERN, REPOSITORY_LIMITS, validateGithubConfig } from "#lib/github.ts";
import { renderGithubImage } from "#lib/server/frame-schedule.ts";
import { githubGraphql } from "#lib/server/github-api.ts";
import { deleteGithubIntegration, getGithubIntegration, saveGithubIntegration } from "#lib/server/github-integration.ts";

const logger = getLogger(["@framik", "api", "github"]);

export const githubConfigSchema = t.Union([
	t.Object({ mode: t.Literal("contributions"), username: t.String({ pattern: GITHUB_USERNAME_PATTERN }) }),
	t.Object({
		mode: t.Literal("repository"),
		repo: t.String({ pattern: GITHUB_REPO_PATTERN }),
		commits: t.Integer({ minimum: 1, maximum: REPOSITORY_LIMITS.commits }),
		pulls: t.Integer({ minimum: 0, maximum: REPOSITORY_LIMITS.pulls }),
	}),
]);

export const githubRoutes = new Elysia({ prefix: "/github" })
	.onError(({ code, error, path }) => {
		if (code === "UNKNOWN" || code === "INTERNAL_SERVER_ERROR") logger.error`${path} failed: ${error}`;
	})
	.resolve(async ({ request, status }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) return status("Unauthorized");
		return { userId: session.user.id };
	})
	.get("/integration", async ({ userId }) => {
		const integration = await getGithubIntegration(userId);
		return integration ? { connected: true as const, login: integration.login } : { connected: false as const };
	})
	.post(
		"/integration",
		async ({ userId, body, status }) => {
			const token = body.token.trim();
			try {
				const { viewer } = await githubGraphql<{ viewer: { login: string } }>(token, "query { viewer { login } }");
				await saveGithubIntegration(userId, { login: viewer.login, token });
				logger.info`GitHub integration saved for user ${userId}`;
				return { login: viewer.login };
			} catch (error) {
				return status("Bad Request", error instanceof Error ? error.message : "Could not verify the token");
			}
		},
		{ body: t.Object({ token: t.String({ minLength: 1 }) }) },
	)
	.delete("/integration", async ({ userId }) => {
		await deleteGithubIntegration(userId);
		logger.info`GitHub integration removed for user ${userId}`;
	})
	.get("/repos", async ({ userId, status }) => {
		const integration = await getGithubIntegration(userId);
		if (!integration) return status("Precondition Failed", "GitHub is not connected");

		const { viewer } = await githubGraphql<{ viewer: { repositories: { nodes: { nameWithOwner: string }[] } } }>(
			integration.token,
			"query { viewer { repositories(first: 100, orderBy: { field: PUSHED_AT, direction: DESC }, affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) { nodes { nameWithOwner } } } }",
		);
		return viewer.repositories.nodes.map((repository) => repository.nameWithOwner);
	})
	.post(
		"/preview",
		async ({ userId, body, status }) => {
			const invalid = validateGithubConfig(body);
			if (invalid) return status("Bad Request", invalid);

			try {
				const dithered = await applyDitheringNode(await renderGithubImage(body, userId));
				return `data:image/png;base64,${await toMeasuredColorsNode(dithered)}`;
			} catch (error) {
				logger.warn`GitHub ${body.mode} preview failed: ${error}`;
				return status("Bad Gateway", error instanceof Error ? error.message : "Could not load GitHub data");
			}
		},
		{ body: githubConfigSchema },
	);
