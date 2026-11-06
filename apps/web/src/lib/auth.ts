import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { BETTER_AUTH_SECRET } from "$app/env/private";
import { db } from "./server/db";

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [organization()],
});
