<script lang="ts">
import WidgetFrame from "$lib/components/widgets/core/widget-frame.svelte";
import WidgetRenderer from "$lib/components/widgets/core/widget-renderer.svelte";

const { image, showProcessedPreview }: { image: string | undefined, showProcessedPreview: boolean } = $props();
</script>

<WidgetFrame>
    <WidgetRenderer {image} {showProcessedPreview}/>
</WidgetFrame>
