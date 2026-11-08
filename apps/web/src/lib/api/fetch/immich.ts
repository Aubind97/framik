import { type FetchQueryOptions, infiniteQueryOptions, type QueryClient } from "@tanstack/svelte-query";
import type { ImmichHeader } from "#lib/immich.ts";
import { getErrorMessage, getFetcher } from "./index.ts";

export type ImmichIntegrationBody = { url: string; apiKey: string; headers: ImmichHeader[] };
export type ImmichAsset = { id: string; takenAt: string };
export type ImmichTimelineFilter = { albumId?: string; order: "asc" | "desc" };

const BUCKETS_STALE_TIME_MS = 5 * 60_000;

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

function getImmichTimelineBucketsQueryOptions(filter: ImmichTimelineFilter, fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["immich", "timeline", filter, "buckets"],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/immich/timeline/buckets", { method: "GET", query: filter });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
		staleTime: BUCKETS_STALE_TIME_MS,
	} satisfies FetchQueryOptions;
}

/** Each page is one month, loaded in timeline order. */
export function getImmichTimelineInfiniteQueryOptions(queryClient: QueryClient, filter: ImmichTimelineFilter, fetch?: typeof globalThis.fetch) {
	return infiniteQueryOptions({
		queryKey: ["immich", "timeline", filter, "assets"],
		queryFn: async ({ pageParam }) => {
			const buckets = await queryClient.fetchQuery(getImmichTimelineBucketsQueryOptions(filter, fetch));
			const bucket = buckets[pageParam];
			if (!bucket) return { timeBucket: undefined, items: [], hasNext: false };

			const { data, error } = await getFetcher(fetch)("/api/immich/timeline/bucket", { method: "GET", query: { ...filter, timeBucket: bucket.timeBucket } });
			if (error) throw new Error(getErrorMessage(error));
			return { timeBucket: bucket.timeBucket, items: data.items, hasNext: pageParam + 1 < buckets.length };
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, _pages, lastPageParam) => (lastPage.hasNext ? lastPageParam + 1 : undefined),
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
