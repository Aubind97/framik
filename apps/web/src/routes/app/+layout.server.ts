import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Check if user is authenticated in the server
	if (!locals.user || !locals.session) {
		// Redirect to sign-in page with the current URL as a redirect parameter
		const redirectTo = url.pathname + url.search;
		throw redirect(302, `/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
	}

	// Inject user data in the page
	return {
		user: locals.user,
		session: locals.session,
	};
};
