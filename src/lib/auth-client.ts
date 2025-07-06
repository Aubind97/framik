import { env } from "$env/dynamic/private";
import { createAuthClient } from "better-auth/svelte";

export const { signUp, signIn, signOut } = createAuthClient({
	baseURL: env.BETTER_AUTH_URL,
});
