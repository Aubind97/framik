<script lang="ts">
import { Check, ChevronsUpDown } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { tick } from "svelte";
import { getImmichAlbumsQueryOptions, type ImmichTimelineFilter } from "#lib/api/fetch/immich.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import * as Command from "#lib/components/ui/command/index.ts";
import * as Popover from "#lib/components/ui/popover/index.ts";
import { matchesSearch } from "#lib/immich.ts";
import { cn } from "#lib/utils.ts";

const { onChange }: { onChange: (filter: ImmichTimelineFilter) => void } = $props();

const ALL_PHOTOS = "All photos";

const albumsQuery = createQuery(() => getImmichAlbumsQueryOptions());

let open = $state(false);
let selectedId = $state<string | undefined>(undefined);
let triggerRef = $state<HTMLButtonElement | null>(null);

const groups = $derived([
	{ heading: "My albums", albums: albumsQuery.data?.owned ?? [] },
	{ heading: "Shared with me", albums: albumsQuery.data?.shared ?? [] },
]);
const selectedAlbum = $derived(groups.flatMap((group) => group.albums).find((album) => album.id === selectedId));

// Items are keyed by album id and searched by their name keyword only.
function filter(_value: string, search: string, keywords?: string[]) {
	return keywords?.some((keyword) => matchesSearch(keyword, search)) ? 1 : 0;
}

async function select(album: { id: string; order: "asc" | "desc" } | undefined) {
	selectedId = album?.id;
	onChange(album ? { albumId: album.id, order: album.order } : { order: "desc" });
	open = false;
	await tick();
	triggerRef?.focus();
}
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <Popover.Root bind:open>
        <Popover.Trigger bind:ref={triggerRef}>
            {#snippet child({ props })}
                <Button {...props} variant="outline" role="combobox" aria-expanded={open} aria-label="Album" class="w-64 justify-between font-normal">
                    <span class="truncate">{selectedAlbum?.name ?? ALL_PHOTOS}</span>
                    <ChevronsUpDown class="opacity-50" />
                </Button>
            {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-72 p-0" align="end">
            <Command.Root {filter}>
                <Command.Input placeholder="Search albums..." />
                <Command.List>
                    <Command.Empty>No album found.</Command.Empty>
                    <Command.Group>
                        <Command.Item value="all" keywords={[ALL_PHOTOS]} onSelect={() => select(undefined)}>
                            <Check class={cn(selectedId !== undefined && "text-transparent")} />
                            {ALL_PHOTOS}
                        </Command.Item>
                    </Command.Group>
                    {#if albumsQuery.isPending}
                        <Command.Loading class="px-2 py-1.5 text-sm text-muted-foreground">Loading albums…</Command.Loading>
                    {/if}
                    {#each groups as group (group.heading)}
                        {#if group.albums.length > 0}
                            <Command.Separator />
                            <Command.Group heading={group.heading}>
                                {#each group.albums as album (album.id)}
                                    <Command.Item value={album.id} keywords={[album.name]} onSelect={() => select(album)}>
                                        <Check class={cn(selectedId !== album.id && "text-transparent")} />
                                        <span class="flex-1 truncate">{album.name}</span>
                                        <span class="text-xs text-muted-foreground tabular-nums">{album.assetCount}</span>
                                    </Command.Item>
                                {/each}
                            </Command.Group>
                        {/if}
                    {/each}
                </Command.List>
            </Command.Root>
        </Popover.Content>
    </Popover.Root>

    {#if albumsQuery.isError}
        <p class="text-sm text-destructive">Albums unavailable: {albumsQuery.error.message}</p>
    {/if}
</div>
