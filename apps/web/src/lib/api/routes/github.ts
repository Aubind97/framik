import { applyDitheringNode, toMeasuredColorsNode } from "@framik/shared/node";
import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { renderGithubImage } from "#lib/server/frame-schedule.ts";
import { GITHUB_USERNAME_PATTERN } from "#lib/server/github.ts";

const logger = getLogger(["@framik", "api", "github"]);

export const githubRoutes = new Elysia({ prefix: "/github" })
	.onBeforeHandle(async ({ request, status }) => {
		if (!(await auth.api.getSession({ headers: request.headers }))) return status("Unauthorized");
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
