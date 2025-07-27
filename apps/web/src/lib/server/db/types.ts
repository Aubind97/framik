import type { session, user } from "./auth.schema.ts";
import type { frame } from "./frame.schema.ts";

export type AuthUser = typeof user.$inferSelect;
export type AuthSession = typeof session.$inferSelect;

export type Frame = typeof frame.$inferSelect;
