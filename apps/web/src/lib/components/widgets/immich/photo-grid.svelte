<script lang="ts">
import { LoaderCircle } from "@lucide/svelte";
import { createInfiniteQuery } from "@tanstack/svelte-query";
import { getImmichAssetsInfiniteQueryOptions, getImmichThumbnailUrl, type ImmichAsset } from "#lib/api/fetch/immich.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import { Skeleton } from "#lib/components/ui/skeleton/index.ts";

const { selectedId, onSelect }: { selectedId?: string; onSelect?: (asset: ImmichAsset) => void } = $props();

const assetsQuery = createInfiniteQuery(() => getImmichAssetsInfiniteQueryOptions());

const assets = $derived(assetsQuery.data?.pages.flatMap((page) => page.items) ?? []);

let sentinel = $state<HTMLElement>();

$effect(() => {
	const element = sentinel;
	const canLoadMore = assetsQuery.hasNextPage && !assetsQuery.isFetchingNextPage;
	if (!element || !canLoadMore) return;

	// Re-created after each page so a sentinel that is still visible triggers the next fetch.
	const observer = new IntersectionObserver(
		(entries) => {
			if (entries.some((entry) => entry.isIntersecting)) assetsQuery.fetchNextPage();
		},
		{ rootMargin: "400px" },
	);
	observer.observe(element);
	return () => observer.disconnect();
});

function formatDate(date: string) {
	return new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" });
}
</script>

{#if assetsQuery.isPending}
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-1">
        {#each { length: 16 }, index (index)}
            <Skeleton class="aspect-square rounded" />
        {/each}
    </div>
{:else if !assetsQuery.data}
    <div class="flex flex-col items-center gap-2 p-8 text-center">
        <p class="text-destructive">{assetsQuery.error?.message}</p>
        <Button variant="secondary" onclick={() => assetsQuery.refetch()}>Retry</Button>
    </div>
{:else if assets.length === 0}
    <p class="p-8 text-center text-muted-foreground">No photos found in your Immich library.</p>
{:else}
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-1">
        {#each assets as asset (asset.id)}
            <button
                type="button"
                class="aspect-square overflow-hidden rounded bg-muted outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring {selectedId === asset.id ? 'ring-3 ring-primary ring-inset' : ''}"
                title="{asset.name} · {formatDate(asset.takenAt)}"
                aria-pressed={selectedId === asset.id}
                onclick={() => onSelect?.(asset)}
            >
                <img src={getImmichThumbnailUrl(asset.id)} alt={asset.name} loading="lazy" draggable="false" class="size-full object-cover {selectedId === asset.id ? 'opacity-80' : ''}" />
            </button>
        {/each}
    </div>

    <div bind:this={sentinel} class="flex justify-center p-4">
        {#if assetsQuery.isFetchingNextPage}
            <LoaderCircle class="animate-spin text-muted-foreground" />
        {:else if assetsQuery.isFetchNextPageError}
            <Button variant="secondary" onclick={() => assetsQuery.fetchNextPage()}>Load more</Button>
        {/if}
    </div>
{/if}
