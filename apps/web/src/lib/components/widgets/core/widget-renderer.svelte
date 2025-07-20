<script lang="ts">
import { applyFloydSteinbergDitheringBrowser } from "@framink/shared/browser";
import { SCREENS } from "$lib/constants";

const { image }: { image: string | undefined } = $props();

let formattedImage = $state<undefined | string>(undefined);

const ratio = `${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.width}/${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.height}`;

$effect(() => {
	if (image) {
		applyFloydSteinbergDitheringBrowser(image).then((img) => {
			formattedImage = img;
		});
	}
});
</script>

<div class="bg-muted rounded overflow-hidden flex items-center justify-center h-full" style={`aspect-ratio: ${ratio}`}>
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
            style="image-rendering: pixelated"
        />{/if}
</div>
