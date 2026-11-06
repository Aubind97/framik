import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { PUBLIC_DOMAIN } from "$app/env/public";

export const {
	signUp,
	signIn,
	signOut,
	useListOrganizations,
	useActiveOrganization,
	useSession,
	organization: { create: createOrganization, setActive: selectActiveOrganization },
} = createAuthClient({ baseURL: PUBLIC_DOMAIN, plugins: [organizationClient()] });
