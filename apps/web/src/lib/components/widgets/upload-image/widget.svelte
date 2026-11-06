<script lang="ts">
import { LayoutGrid } from "@lucide/svelte";
import { Input } from "#lib/components/ui/input/index.ts";
import Label from "#lib/components/ui/label/label.svelte";
import * as Select from "#lib/components/ui/select/index.ts";
import { Toggle } from "#lib/components/ui/toggle/index.ts";
import ImageEditor from "#lib/components/widgets/core/image-editor.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";

const { handleImageLoad, currentImage }: { handleImageLoad?: (image: string) => void; currentImage?: string | null } = $props();

let image = $state<string | undefined>(undefined);
let showProcessedPreview = $state(true);

let source = $state<string | undefined>(undefined);
let preview = $state<HTMLElement>();
let dragging = $state(false);

function loadImage(event: Event) {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (!file) return;
	if (source) URL.revokeObjectURL(source);
	source = URL.createObjectURL(file);
}

function handleEdit(edited: string) {
	image = edited;
	handleImageLoad?.(edited);
}
</script>

<div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
    <!-- the frame image is already dithered -->
    <div bind:this={preview}>
        <Widget image={image ?? currentImage} showProcessedPreview={image ? showProcessedPreview && !dragging : false} />
    </div>

    <aside class="p-4 border rounded min-w-64 flex flex-col gap-4">
        <h1 class="font-bold">Settings</h1>
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>Load image</Label>
                <Input type="file" onchange={loadImage} accept="image/png, image/jpeg"/>
            </div>

            {#if source}
                {#key source}
                    <ImageEditor {source} target={preview} onChange={handleEdit} bind:dragging />
                {/key}
            {/if}

            <Label>
                <Toggle variant="outline" aria-label="Toggle pixelated preview" bind:pressed={showProcessedPreview}>
                    <LayoutGrid class="size-4" />
                </Toggle>
                Show processed preview
            </Label>
        </div>
    </aside>
</div>
