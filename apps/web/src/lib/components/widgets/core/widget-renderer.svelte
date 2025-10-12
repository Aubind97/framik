<script lang="ts">
import { applyDitheringBrowser } from "@framik/shared/browser";
import { SCREENS } from "$lib/constants";

const { image, showProcessedPreview }: { image: string | undefined; showProcessedPreview: boolean } = $props();

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
    {:else}
        <img
            alt="widget renderer"
            src={formattedImage}
            class="w-full"
            style={'filter: brightness(1) saturate(.8)'}
        />{/if}
</div>
