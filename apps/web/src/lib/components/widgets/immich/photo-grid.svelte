<script lang="ts">
import { LoaderCircle } from "@lucide/svelte";
import { createInfiniteQuery, useQueryClient } from "@tanstack/svelte-query";
import { getImmichThumbnailUrl, getImmichTimelineInfiniteQueryOptions, type ImmichAsset, type ImmichTimelineFilter } from "#lib/api/fetch/immich.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import { Skeleton } from "#lib/components/ui/skeleton/index.ts";
import { formatTimeBucket } from "#lib/immich.ts";
import { cn } from "#lib/utils.ts";

const { filter, selectedId, onSelect, class: className }: { filter: ImmichTimelineFilter; selectedId?: string; onSelect?: (asset: ImmichAsset) => void; class?: string } = $props();

const queryClient = useQueryClient();
const assetsQuery = createInfiniteQuery(() => getImmichTimelineInfiniteQueryOptions(queryClient, filter));

const months = $derived(assetsQuery.data?.pages.filter((page) => page.items.length > 0) ?? []);

let scroller = $state<HTMLElement>();
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
		{ root: scroller, rootMargin: "400px" },
	);
	observer.observe(element);
	return () => observer.disconnect();
});

function formatDate(date: string) {
	return new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" });
}

const GRID = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-1";
</script>

<div bind:this={scroller} class={cn("overflow-y-auto px-1 pb-1", className)}>
    {#if assetsQuery.isPending}
        <div class={GRID}>
            {#each { length: 16 }, index (index)}
                <Skeleton class="aspect-square rounded" />
            {/each}
        </div>
    {:else if !assetsQuery.data}
        <div class="flex flex-col items-center gap-2 p-8 text-center">
            <p class="text-destructive">{assetsQuery.error?.message}</p>
            <Button variant="secondary" onclick={() => assetsQuery.refetch()}>Retry</Button>
        </div>
    {:else}
        {#each months as month (month.timeBucket)}
            <section>
                <h3 class="sticky top-0 z-10 bg-background/90 backdrop-blur px-1 py-2 text-sm font-semibold capitalize">{formatTimeBucket(month.timeBucket ?? "")}</h3>
                <div class={GRID}>
                    {#each month.items as asset (asset.id)}
                        <button
                            type="button"
                            class="aspect-square overflow-hidden rounded bg-muted outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring {selectedId === asset.id ? 'ring-3 ring-primary' : ''}"
                            title={formatDate(asset.takenAt)}
                            aria-pressed={selectedId === asset.id}
                            onclick={() => onSelect?.(asset)}
                        >
                            <img src={getImmichThumbnailUrl(asset.id)} alt="Photo from {formatDate(asset.takenAt)}" loading="lazy" draggable="false" class="size-full object-cover {selectedId === asset.id ? 'opacity-75' : ''}" />
                        </button>
                    {/each}
                </div>
            </section>
        {:else}
            {#if !assetsQuery.hasNextPage && !assetsQuery.isFetching}
                <p class="p-8 text-center text-muted-foreground">No photos here yet.</p>
            {/if}
        {/each}

        <div bind:this={sentinel} class="flex justify-center p-4">
            {#if assetsQuery.isFetchingNextPage}
                <LoaderCircle class="animate-spin text-muted-foreground" />
            {:else if assetsQuery.isFetchNextPageError}
                <Button variant="secondary" onclick={() => assetsQuery.fetchNextPage()}>Load more</Button>
            {/if}
        </div>
    {/if}
</div>
