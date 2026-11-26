import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { GithubConfig } from "#lib/github.ts";
import { user } from "./auth.schema.ts";
import { frame } from "./frame.schema.ts";

export const frameSchedule = sqliteTable("frame_schedule", {
	frameId: text("frame_id")
		.primaryKey()
		.references(() => frame.id, { onDelete: "cascade" }),
	// Whose integrations (e.g. GitHub token) the scheduler uses when nobody is signed in
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	widget: text("widget", { enum: ["github"] }).notNull(),
	config: text("config", { mode: "json" }).$type<GithubConfig>().notNull(),
	lastPushedAt: integer("last_pushed_at", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});
