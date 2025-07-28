<script lang="ts">
import { LayoutGrid, RefreshCw } from "@lucide/svelte";
import { onMount } from "svelte";
import { Button } from "$lib/components/ui/button";
import Label from "$lib/components/ui/label/label.svelte";
import { Toggle } from "$lib/components/ui/toggle";
import Widget from "$lib/components/widgets/core/widget.svelte";
import { SCREENS } from "$lib/constants";

const { handleImageLoad }: { handleImageLoad?: (image: string) => void } = $props();

let image = $state<string | undefined>(undefined);
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
			const base64Image = res as string;
			image = base64Image;
			handleImageLoad?.(base64Image);
		});
}

onMount(() => {
	loadImage();
});
</script>

<div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
    <Widget {image} {showProcessedPreview} />

    <aside class="p-4 border rounded min-w-64 flex flex-col gap-4">
        <h1 class="font-bold">Settings</h1>
        <div class="flex flex-col gap-4">
            <Button variant="secondary" onclick={loadImage}>
                <RefreshCw />
                Change image
            </Button>

            <Label>
                <Toggle variant="outline" aria-label="Toggle pixelated preview" bind:pressed={showProcessedPreview}>
                    <LayoutGrid class="size-4" />
                </Toggle>
                Show processed preview
            </Label>
        </div>
    </aside>
</div>
