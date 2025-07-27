// See https://svelte.dev/docs/kit/types#app.d.ts

import type { AuthSession, AuthUser } from "$lib/server/db/types";
import type { QueryClient } from "@tanstack/svelte-query";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			queryClient: QueryClient;
			user: AuthUser | null;
			session: AuthSession | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}
