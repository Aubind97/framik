<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { getImmichAlbumsQueryOptions, type ImmichTimelineFilter } from "#lib/api/fetch/immich.ts";
import * as Select from "#lib/components/ui/select/index.ts";

const { onChange }: { onChange: (filter: ImmichTimelineFilter) => void } = $props();

const ALL_PHOTOS = "all";

const albumsQuery = createQuery(() => getImmichAlbumsQueryOptions());

let value = $state(ALL_PHOTOS);

const groups = $derived([
	{ heading: "My albums", albums: albumsQuery.data?.owned ?? [] },
	{ heading: "Shared with me", albums: albumsQuery.data?.shared ?? [] },
]);
const selectedAlbum = $derived(groups.flatMap((group) => group.albums).find((album) => album.id === value));

function handleValueChange(next: string) {
	value = next;
	const album = groups.flatMap((group) => group.albums).find((candidate) => candidate.id === next);
	onChange(album ? { albumId: album.id, order: album.order } : { order: "desc" });
}
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <Select.Root type="single" {value} onValueChange={handleValueChange}>
        <Select.Trigger class="w-64" aria-label="Album">
            <span class="truncate">{selectedAlbum?.name ?? "All photos"}</span>
        </Select.Trigger>
        <Select.Content>
            <Select.Item value={ALL_PHOTOS} label="All photos">All photos</Select.Item>
            {#each groups as group (group.heading)}
                {#if group.albums.length > 0}
                    <Select.Separator />
                    <Select.Group>
                        <Select.GroupHeading>{group.heading}</Select.GroupHeading>
                        {#each group.albums as album (album.id)}
                            <Select.Item value={album.id} label={album.name}>
                                <span class="flex-1 truncate">{album.name}</span>
                                <span class="text-xs text-muted-foreground tabular-nums">{album.assetCount}</span>
                            </Select.Item>
                        {/each}
                    </Select.Group>
                {/if}
            {/each}
        </Select.Content>
    </Select.Root>

    {#if albumsQuery.isError}
        <p class="text-sm text-destructive">Albums unavailable: {albumsQuery.error.message}</p>
    {/if}
</div>
