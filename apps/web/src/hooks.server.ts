import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { auth } from "$lib/auth";
import type { AuthSession, AuthUser } from "$lib/server/db/types";

export async function handle({ event, resolve }) {
	// Get session from better-auth
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	// Inject user and session data into locals
	if (session) {
		event.locals.user = session.user as AuthUser;
		event.locals.session = session.session as AuthSession;
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
