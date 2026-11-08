<script lang="ts">
import { Images, LayoutGrid } from "@lucide/svelte";
import { getImmichThumbnailUrl, type ImmichAsset, type ImmichTimelineFilter } from "#lib/api/fetch/immich.ts";
import Label from "#lib/components/ui/label/label.svelte";
import { Toggle } from "#lib/components/ui/toggle/index.ts";
import ImageEditor from "#lib/components/widgets/core/image-editor.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import PhotoGrid from "./photo-grid.svelte";

const { handleImageLoad }: { handleImageLoad?: (image: string | undefined) => void } = $props();

let selected = $state<ImmichAsset | undefined>(undefined);
let filter = $state<ImmichTimelineFilter>({ order: "desc" });
let image = $state<string | undefined>(undefined);
let showProcessedPreview = $state(true);

let preview = $state<HTMLElement>();
let dragging = $state(false);

function handleSelect(asset: ImmichAsset) {
	if (asset.id === selected?.id) return;

	selected = asset;
	image = undefined;
	handleImageLoad?.(undefined);
}

function handleEdit(edited: string) {
	image = edited;
	handleImageLoad?.(edited);
}
</script>

<div class="w-full flex flex-col gap-6">
    {#if selected}
        <div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
            <div bind:this={preview}>
                <Widget {image} showProcessedPreview={showProcessedPreview && !dragging} />
            </div>

            <aside class="p-4 border rounded min-w-64 lg:max-w-72 flex flex-col gap-4">
                <div>
                    <h1 class="font-bold">Settings</h1>
                    <p class="text-sm text-muted-foreground">{new Date(selected.takenAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}</p>
                </div>

                {#key selected.id}
                    <ImageEditor source={getImmichThumbnailUrl(selected.id, "preview")} target={preview} onChange={handleEdit} bind:dragging />
                {/key}

                <Label>
                    <Toggle variant="outline" aria-label="Toggle pixelated preview" bind:pressed={showProcessedPreview}>
                        <LayoutGrid class="size-4" />
                    </Toggle>
                    Show processed preview
                </Label>
            </aside>
        </div>
    {:else}
        <div class="flex items-center gap-3 rounded-md border border-dashed p-4 text-muted-foreground">
            <Images class="size-5 shrink-0" />
            <p>Select a photo to crop it and send it to a frame.</p>
        </div>
    {/if}

    <section class="flex flex-col gap-3">
        <h2 class="font-bold">Your photos</h2>
        <PhotoGrid {filter} selectedId={selected?.id} onSelect={handleSelect} class="max-h-[60vh] rounded-md border" />
    </section>
</div>
