import { edenFetch } from "@elysiajs/eden";
import { PUBLIC_DOMAIN } from "$app/env/public";

import type { InternalAPI } from "../../../routes/api/[...slugs]/+server";

export const getFetcher = (fetch?: typeof globalThis.fetch) => edenFetch<InternalAPI>(PUBLIC_DOMAIN, { fetcher: fetch });

export function getErrorMessage(error: { status: number; value: unknown }) {
	if (typeof error.value === "string" && error.value) return error.value;
	const message = (error.value as { message?: unknown } | null)?.message;
	return typeof message === "string" ? message : `Request failed (${error.status})`;
}
