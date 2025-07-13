<script lang="ts">
import { onMount } from "svelte";
import Widget from "$lib/components/widgets/core/widget.svelte";

let image = $state<string | undefined>(undefined);

const formattedURL = new URL("http://localhost:5173/api/generator");

const url = "https://openweathermap.org/city/3024635";
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
