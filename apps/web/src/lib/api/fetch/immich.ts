import type { FetchQueryOptions } from "@tanstack/svelte-query";
import type { ImmichHeader } from "#lib/immich.ts";
import { getFetcher } from "./index.ts";

export type ImmichIntegrationBody = { url: string; apiKey: string; headers: ImmichHeader[] };

export function getImmichIntegrationQueryOptions(fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["immich", "integration"],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/immich/integration", { method: "GET" });
			if (error) throw error;
			return data;
		},
	} satisfies FetchQueryOptions;
}

export function saveImmichIntegration(body: ImmichIntegrationBody, fetch?: typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/immich/integration", { method: "POST", body });
}

export function deleteImmichIntegration(fetch?: typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/immich/integration", { method: "DELETE" });
}

export function testImmichIntegration(body: ImmichIntegrationBody, fetch?: typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/immich/integration/test", { method: "POST", body });
}
