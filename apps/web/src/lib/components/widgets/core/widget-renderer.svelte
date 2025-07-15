<script lang="ts">
import { applyFloydSteinbergDitheringBrowser } from "@framink/shared/browser";
const { image }: { image: string | undefined } = $props();

let formattedImage = $state<undefined | string>(undefined);

$effect(() => {
	if (image) {
		applyFloydSteinbergDitheringBrowser(image).then((img) => {
			console.log(img);
			formattedImage = img;
		});
	}
});
</script>

<div class="bg-muted rounded overflow-hidden flex items-center justify-center">
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
            style="image-rendering: pixelated;"
        />{/if}
</div>
