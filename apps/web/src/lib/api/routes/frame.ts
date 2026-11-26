import { randomUUID } from "node:crypto";
import { getLogger } from "@logtape/logtape";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { frame } from "#lib/server/db/frame.schema.ts";
import { frameSchedule } from "#lib/server/db/frame-schedule.schema.ts";
import { db } from "#lib/server/db/index.ts";
import { runFrameSchedule } from "#lib/server/frame-schedule.ts";
import { GITHUB_USERNAME_PATTERN } from "#lib/server/github.ts";

const logger = getLogger(["@framik", "api", "frames"]);

async function isFrameInActiveOrganization(headers: Headers, frameId: string) {
	const organizationId = (await auth.api.getSession({ headers }))?.session.activeOrganizationId;
	if (!organizationId) return false;

	const [row] = await db
		.select({ id: frame.id })
		.from(frame)
		.where(and(eq(frame.id, frameId), eq(frame.organizationId, organizationId)));
	return !!row;
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
			if (!(await isFrameInActiveOrganization(request.headers, params.id))) return status("Not Found");

			const [schedule] = await db.select().from(frameSchedule).where(eq(frameSchedule.frameId, params.id));
			return schedule ?? null;
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.post(
		"/:id/schedule",
		async ({ params, body, request, status }) => {
			if (!(await isFrameInActiveOrganization(request.headers, params.id))) return status("Not Found");

			const values = { widget: body.widget, config: body.config, lastPushedOn: null, updatedAt: new Date() };
			await db
				.insert(frameSchedule)
				.values({ frameId: params.id, ...values })
				.onConflictDoUpdate({ target: frameSchedule.frameId, set: values });
			logger.info`Frame ${params.id} scheduled with ${body.widget}`;

			try {
				await runFrameSchedule(params.id);
			} catch (error) {
				logger.error`First scheduled push to frame ${params.id} failed: ${error}`;
				return status("Bad Gateway", "Schedule saved, but the first push failed. It will be retried within the hour.");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				widget: t.Literal("github"),
				config: t.Object({ username: t.String({ pattern: GITHUB_USERNAME_PATTERN }) }),
			}),
		},
	);
