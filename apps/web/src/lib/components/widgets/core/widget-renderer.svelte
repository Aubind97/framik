<script lang="ts">
import { applyDitheringBrowser } from "@framik/shared/browser";
import { ImageOff } from "@lucide/svelte";
import { SCREENS } from "#lib/constants.ts";

// undefined = loading, null = no image
const { image, showProcessedPreview }: { image: string | null | undefined; showProcessedPreview: boolean } = $props();

let formattedImage = $state<undefined | string>(undefined);

const ratio = `${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.width}/${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.height}`;

$effect(() => {
	if (image) {
		if (showProcessedPreview) {
			applyDitheringBrowser(image).then((img) => {
				formattedImage = img;
			});
		} else {
			formattedImage = image;
		}
	} else {
		formattedImage = undefined;
	}
});
</script>

<div class="bg-muted rounded overflow-hidden flex items-center justify-center h-full select-none" style={`aspect-ratio: ${ratio}`}>
    {#if image === undefined}
        <div class="p-2">
            <span
                class="block animate-spin w-8 h-8 border-4 rounded-full border-l-transparent"
            ></span>
        </div>
    {:else if image === null}
        <div class="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageOff class="size-8" />
            <span>No image on frame</span>
        </div>
    {:else}
        <img
            alt="widget renderer"
            src={formattedImage}
            class="w-full"
            style={'filter: brightness(1) saturate(.8)'}
        />{/if}
</div>
