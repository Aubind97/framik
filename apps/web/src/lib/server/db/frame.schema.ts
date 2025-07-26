import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organization } from "./auth.schema.ts";

export const frame = sqliteTable("frame", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id),
	name: text("name").notNull(),
	apiUrl: text("apiUrl").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});
