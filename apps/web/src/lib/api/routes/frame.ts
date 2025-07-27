import { randomUUID } from "node:crypto";
import { getLogger } from "@logtape/logtape";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "$lib/server/db";
import { frame } from "$lib/server/db/frame.schema";

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
	);
