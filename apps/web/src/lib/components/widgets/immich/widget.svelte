<script lang="ts">
import { LayoutGrid } from "@lucide/svelte";
import { getImmichThumbnailUrl, type ImmichAsset, type ImmichTimelineFilter } from "#lib/api/fetch/immich.ts";
import Label from "#lib/components/ui/label/label.svelte";
import { Toggle } from "#lib/components/ui/toggle/index.ts";
import ImageEditor from "#lib/components/widgets/core/image-editor.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import AlbumPicker from "./album-picker.svelte";
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

// From lg up the page fits the viewport: the preview is capped so the photo grid always keeps two rows.
// --photos-min: two rows of square tiles (6 columns at lg, 8 at xl, sized from @container/main) plus headings.
// --immich-chrome: header, page padding, title, gaps and frame padding above and below the preview.
const PREVIEW_FIT = "lg:h-auto lg:mx-auto lg:w-[min(100%,calc((100svh-var(--immich-chrome)-var(--photos-min))*var(--frame-aspect)))]";

function handleEdit(edited: string) {
	image = edited;
	handleImageLoad?.(edited);
}
</script>

<div class="w-full flex flex-col gap-6 lg:flex-1 lg:min-h-0 [--immich-chrome:15rem] lg:[--photos-min:calc(33.4cqw+6.5rem)] xl:[--photos-min:calc(25cqw+6.5rem)]">
    <div class="w-full grid lg:grid-cols-[1fr_auto] gap-4 lg:shrink-0">
        <div bind:this={preview}>
            <!-- null renders the placeholder, undefined the loading spinner -->
            <Widget image={selected ? image : null} showProcessedPreview={showProcessedPreview && !dragging} emptyLabel="Select a photo below" frameClass="lg:p-6" rendererClass={PREVIEW_FIT} />
        </div>

        <aside class="p-4 border rounded min-w-64 lg:max-w-72 flex flex-col gap-4">
            <div>
                <h1 class="font-bold">Settings</h1>
                {#if selected}
                    <p class="text-sm text-muted-foreground">{new Date(selected.takenAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}</p>
                {/if}
            </div>

            {#if selected}
                {#key selected.id}
                    <ImageEditor source={getImmichThumbnailUrl(selected.id, "preview")} target={preview} onChange={handleEdit} bind:dragging />
                {/key}
            {:else}
                <p class="text-sm text-muted-foreground">Select a photo to crop it and send it to a frame.</p>
            {/if}

            <Label>
                <Toggle variant="outline" aria-label="Toggle pixelated preview" bind:pressed={showProcessedPreview}>
                    <LayoutGrid class="size-4" />
                </Toggle>
                Show processed preview
            </Label>
        </aside>
    </div>

    <section class="flex flex-col gap-3 lg:flex-1 lg:min-h-(--photos-min)">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-bold">Your photos</h2>
            <AlbumPicker onChange={(next) => (filter = next)} />
        </div>
        {#key filter.albumId}
            <PhotoGrid {filter} selectedId={selected?.id} onSelect={handleSelect} class="max-h-[60vh] rounded-md border lg:max-h-none lg:flex-1 lg:min-h-0" />
        {/key}
    </section>
</div>
