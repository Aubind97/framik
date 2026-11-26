import { applyDitheringNode, toMeasuredColorsNode } from "@framik/shared/node";
import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { renderPresidentialImage } from "#lib/server/frame-schedule.ts";

const logger = getLogger(["@framik", "api", "presidential"]);

export const presidentialConfigSchema = t.Object({ mode: t.Union([t.Literal("ranking"), t.Literal("trend")]) });

export const presidentialRoutes = new Elysia({ prefix: "/presidential" }).get(
	"/preview",
	async ({ request, query, status }) => {
		if (!(await auth.api.getSession({ headers: request.headers }))) return status("Unauthorized");

		try {
			const dithered = await applyDitheringNode(await renderPresidentialImage(query));
			return `data:image/png;base64,${await toMeasuredColorsNode(dithered)}`;
		} catch (error) {
			logger.warn`Presidential preview failed: ${error}`;
			return status("Bad Gateway", error instanceof Error ? error.message : "Could not load the polls");
		}
	},
	{ query: presidentialConfigSchema },
);
