<script lang="ts">
import { onMount } from "svelte";
import Widget from "$lib/components/widgets/core/widget.svelte";
import { SCREENS } from "$lib/constants";

let image = $state<string | undefined>(undefined);

const url = `https://picsum.photos/${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.width}/${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.height}`;

const formattedURL = new URL("http://localhost:5173/api/generator");
formattedURL.searchParams.append("widgetURL", url);

onMount(() => {
	fetch(formattedURL)
		.then((res) => res.text())
		.then((res) => {
			image = res;
		});
});
</script>

<Widget {image} />
