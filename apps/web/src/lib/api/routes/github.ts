import { applyDitheringNode, toMeasuredColorsNode } from "@framik/shared/node";
import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { renderGithubImage } from "#lib/server/frame-schedule.ts";
import { GITHUB_USERNAME_PATTERN } from "#lib/server/github.ts";
import { deleteGithubIntegration, getGithubIntegration, githubGraphql, saveGithubIntegration } from "#lib/server/github-api.ts";

const logger = getLogger(["@framik", "api", "github"]);

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
	.get(
		"/preview",
		async ({ query, status }) => {
			try {
				const dithered = await applyDitheringNode(await renderGithubImage(query.username));
				return `data:image/png;base64,${await toMeasuredColorsNode(dithered)}`;
			} catch (error) {
				logger.warn`GitHub preview for ${query.username} failed: ${error}`;
				return status("Bad Gateway", `Could not load contributions for "${query.username}"`);
			}
		},
		{ query: t.Object({ username: t.String({ pattern: GITHUB_USERNAME_PATTERN }) }) },
	);
