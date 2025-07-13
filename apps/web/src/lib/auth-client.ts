import { createAuthClient } from "better-auth/svelte";
import { env } from "$env/dynamic/private";

export const { signUp, signIn, signOut } = createAuthClient({
	baseURL: env.BETTER_AUTH_URL,
});
