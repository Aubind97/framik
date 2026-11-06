import { ansiColorFormatter, configure, getConsoleSink } from "@logtape/logtape";
import type { ServerInit } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "#lib/auth.ts";
import type { AuthSession, AuthUser } from "#lib/server/db/types.ts";
import { building } from "$app/env";

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

	if (event.url.pathname.startsWith("/api")) {
		// Required for CORS to work
		if (event.request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "*",
				},
			});
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
}

export const init: ServerInit = async () => {
	// Configure logger
	await configure({
		reset: true,
		sinks: {
			console: getConsoleSink({ formatter: await import("@logtape/pretty").then((module) => module.prettyFormatter).catch(() => ansiColorFormatter) }),
		},
		loggers: [
			{ category: ["logtape", "meta"], lowestLevel: undefined, sinks: ["console"] },
			{ category: ["@framik"], lowestLevel: "debug", sinks: ["console"] },
		],
	});
};
