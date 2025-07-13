<script lang="ts">
import WidgetFrame from "$lib/components/widgets/core/widget-frame.svelte";
import WidgetRenderer from "$lib/components/widgets/core/widget-renderer.svelte";

const { image }: { image: string | undefined } = $props();
</script>

<WidgetFrame>
    <WidgetRenderer {image} />
</WidgetFrame>
