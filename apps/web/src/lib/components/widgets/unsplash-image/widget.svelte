<script lang="ts">
import { LayoutGrid, RefreshCw } from "@lucide/svelte";
import { onMount } from "svelte";
import { Button } from "#lib/components/ui/button/index.ts";
import Label from "#lib/components/ui/label/label.svelte";
import { Toggle } from "#lib/components/ui/toggle/index.ts";
import ImageEditor from "#lib/components/widgets/core/image-editor.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import { SCREENS } from "#lib/constants.ts";

const { handleImageLoad }: { handleImageLoad?: (image: string) => void } = $props();

let image = $state<string | undefined>(undefined);
let source = $state<string | undefined>(undefined);
let preview = $state<HTMLElement>();
let dragging = $state(false);
let showProcessedPreview = $state(true);

async function loadImage() {
	const url = `https://picsum.photos/${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.width}/${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.height}.jpg`;

	image = undefined;

	return fetch(url)
		.then((response) => response.blob())
		.then(
			(blob) =>
				new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result);
					reader.onerror = reject;
					return reader.readAsDataURL(blob);
				}),
		)
		.then((res) => {
			source = res as string;
		});
}

function handleEdit(edited: string) {
	image = edited;
	handleImageLoad?.(edited);
}

onMount(() => {
	loadImage();
});
</script>

<div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
    <div bind:this={preview}>
        <Widget {image} showProcessedPreview={showProcessedPreview && !dragging} />
    </div>

    <aside class="p-4 border rounded min-w-64 flex flex-col gap-4">
        <h1 class="font-bold">Settings</h1>
        <div class="flex flex-col gap-4">
            <Button variant="secondary" onclick={loadImage}>
                <RefreshCw />
                Change image
            </Button>

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
