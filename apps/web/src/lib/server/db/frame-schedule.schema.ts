import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { frame } from "./frame.schema.ts";

export const frameSchedule = sqliteTable("frame_schedule", {
	frameId: text("frame_id")
		.primaryKey()
		.references(() => frame.id, { onDelete: "cascade" }),
	widget: text("widget", { enum: ["github"] }).notNull(),
	config: text("config", { mode: "json" }).$type<{ username: string }>().notNull(),
	lastPushedOn: text("last_pushed_on"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});
