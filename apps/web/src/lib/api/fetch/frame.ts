import type { FetchQueryOptions } from "@tanstack/svelte-query";
import { getFetcher } from "./index.ts";

export function getAllFramesQueryOptions(params: { organizationId: string }, fetch?:  typeof globalThis.fetch) {
	return {
		queryKey: ["frames", params.organizationId],
		queryFn: async () => getFetcher(fetch)("/api/frames", { method: "GET", query: { organizationId: params.organizationId } }),
	} satisfies FetchQueryOptions;
}

export function createFrame(body: { organizationId: string; name: string; apiUrl: string }, fetch?:  typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/frames", { method: "POST", body });
}
