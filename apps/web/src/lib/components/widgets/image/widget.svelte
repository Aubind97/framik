<script lang="ts">
import { onMount } from "svelte";
import Widget from "$lib/components/widgets/core/widget.svelte";

let image = $state<string | undefined>(undefined);

const url = "https://openweathermap.org/city/3024635";

onMount(() => {
	fetch(`api/generator?widgetURL=${url}&orientation=${"landscape"}`)
		.then((res) => res.text())
		.then((res) => {
			image = res;
		});
});
</script>

<Widget {image} />
