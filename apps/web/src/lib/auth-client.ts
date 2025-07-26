import { createAuthClient } from "better-auth/svelte";
import { env } from "$env/dynamic/public";

export const { signUp, signIn, signOut } = createAuthClient({
	baseURL: env.PUBLIC_BETTER_AUTH_URL,
});
