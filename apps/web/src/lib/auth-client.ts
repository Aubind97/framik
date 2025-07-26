import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { env } from "$env/dynamic/public";

export const { signUp, signIn, signOut, useListOrganizations, useActiveOrganization, useSession } = createAuthClient({
	baseURL: env.PUBLIC_BETTER_AUTH_URL,
	plugins: [organizationClient()],
});
