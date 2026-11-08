import { type FetchQueryOptions, infiniteQueryOptions } from "@tanstack/svelte-query";
import type { ImmichHeader } from "#lib/immich.ts";
import { getErrorMessage, getFetcher } from "./index.ts";

export type ImmichIntegrationBody = { url: string; apiKey: string; headers: ImmichHeader[] };
export type ImmichAsset = { id: string; name: string; takenAt: string };
type ImmichAssetsPageParam = { cursor?: string; page?: number };

export function getImmichIntegrationQueryOptions(fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["immich", "integration"],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/immich/integration", { method: "GET" });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
	} satisfies FetchQueryOptions;
}

export function getImmichAssetsInfiniteQueryOptions(fetch?: typeof globalThis.fetch) {
	return infiniteQueryOptions({
		queryKey: ["immich", "assets"],
		queryFn: async ({ pageParam }) => {
			const { data, error } = await getFetcher(fetch)("/api/immich/assets", { method: "GET", query: pageParam });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
		initialPageParam: {} as ImmichAssetsPageParam,
		getNextPageParam: (lastPage): ImmichAssetsPageParam | undefined => lastPage.next ?? undefined,
	});
}

export function getImmichThumbnailUrl(assetId: string, size: "thumbnail" | "preview" = "thumbnail") {
	return `/api/immich/assets/${assetId}/thumbnail?size=${size}`;
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
