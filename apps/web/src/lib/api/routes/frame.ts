import { randomUUID } from "node:crypto";
import { getLogger } from "@logtape/logtape";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { frame } from "#lib/server/db/frame.schema.ts";
import { db } from "#lib/server/db/index.ts";

const logger = getLogger(["@framik", "api", "frames"]);

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
	);
