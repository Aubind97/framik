import { randomUUID } from "node:crypto";
import { getLogger } from "@logtape/logtape";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { githubConfigSchema } from "#lib/api/routes/github.ts";
import { presidentialConfigSchema } from "#lib/api/routes/presidential.ts";
import { auth } from "#lib/auth.ts";
import { validateGithubConfig } from "#lib/github.ts";
import { frame } from "#lib/server/db/frame.schema.ts";
import { frameSchedule } from "#lib/server/db/frame-schedule.schema.ts";
import { db } from "#lib/server/db/index.ts";
import { runFrameSchedule } from "#lib/server/frame-schedule.ts";

const logger = getLogger(["@framik", "api", "frames"]);

/** The signed-in user's id when the frame belongs to their active organization. */
async function getFrameUserId(headers: Headers, frameId: string) {
	const session = await auth.api.getSession({ headers });
	const organizationId = session?.session.activeOrganizationId;
	if (!organizationId) return null;

	const [row] = await db
		.select({ id: frame.id })
		.from(frame)
		.where(and(eq(frame.id, frameId), eq(frame.organizationId, organizationId)));
	return row ? session.user.id : null;
}

export const frameRoutes = new Elysia({ prefix: "/frames" })
	.get(
		"",
		({ query }) => {
			return db.select().from(frame).where(eq(frame.organizationId, query.organizationId)).orderBy(desc(frame.updatedAt));
		},
		{
			query: t.Object({
				organizationId: t.String(),
			}),
		},
	)
	.post(
		"",
		async ({ body }) => {
			const id = randomUUID();
			const frameData = { id, apiUrl: body.apiUrl, name: body.name, organizationId: body.organizationId };
			await db.insert(frame).values(frameData).execute();

			logger.info`Frame created ${frameData}`;
		},
		{
			body: t.Object({
				name: t.String(),
				apiUrl: t.String(),
				organizationId: t.String(),
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params, request, status }) => {
			const session = await auth.api.getSession({ headers: request.headers });
			const organizationId = session?.session.activeOrganizationId;
			if (!organizationId) {
				return status("Unauthorized");
			}

			const deleted = await db
				.delete(frame)
				.where(and(eq(frame.id, params.id), eq(frame.organizationId, organizationId)))
				.returning({ id: frame.id });
			if (deleted.length === 0) {
				return status("Not Found");
			}

			logger.info`Frame deleted ${params.id}`;
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get(
		"/:id/schedule",
		async ({ params, request, status }) => {
			if (!(await getFrameUserId(request.headers, params.id))) return status("Not Found");

			const [schedule] = await db.select().from(frameSchedule).where(eq(frameSchedule.frameId, params.id));
			return schedule ?? null;
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.post(
		"/:id/schedule",
		async ({ params, body, request, status }) => {
			const userId = await getFrameUserId(request.headers, params.id);
			if (!userId) return status("Not Found");
			const invalid = body.widget === "github" ? validateGithubConfig(body.config) : null;
			if (invalid) return status("Bad Request", invalid);

			const values = { userId, widget: body.widget, config: body.config, lastPushedAt: null, updatedAt: new Date() };
			await db
				.insert(frameSchedule)
				.values({ frameId: params.id, ...values })
				.onConflictDoUpdate({ target: frameSchedule.frameId, set: values });
			logger.info`Frame ${params.id} scheduled with ${body.widget}`;

			try {
				await runFrameSchedule(params.id);
			} catch (error) {
				logger.error`First scheduled push to frame ${params.id} failed: ${error}`;
				return status("Bad Gateway", "Schedule saved, but the first push failed. It will be retried shortly.");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Union([
				t.Object({ widget: t.Literal("github"), config: githubConfigSchema }),
				t.Object({ widget: t.Literal("presidential_2027"), config: presidentialConfigSchema }),
			]),
		},
	);
