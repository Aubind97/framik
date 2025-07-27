import type { FetchQueryOptions } from "@tanstack/svelte-query";
import { fetch } from "./index.ts";

export function getAllFramesQueryOptions(params: { organizationId: string }) {
	return {
		queryKey: ["frames", params.organizationId],
		queryFn: async () => fetch("/api/frames", { method: "GET", query: { organizationId: params.organizationId } }),
	} satisfies FetchQueryOptions;
}

export function createFrame(body: { organizationId: string; name: string; apiUrl: string }) {
	return fetch("/api/frames", { method: "POST", body });
}
