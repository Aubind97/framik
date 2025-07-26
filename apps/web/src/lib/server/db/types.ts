import type { session, user } from "./auth.schema.ts";

export type AuthUser = typeof user.$inferSelect;
export type AuthSession = typeof session.$inferSelect;
