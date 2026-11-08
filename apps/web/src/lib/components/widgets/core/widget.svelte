<script lang="ts">
import WidgetFrame from "#lib/components/widgets/core/widget-frame.svelte";
import WidgetRenderer from "#lib/components/widgets/core/widget-renderer.svelte";

const { image, showProcessedPreview, emptyLabel }: { image: string | null | undefined; showProcessedPreview: boolean; emptyLabel?: string } = $props();
</script>

<WidgetFrame>
    <WidgetRenderer {image} {showProcessedPreview} {emptyLabel}/>
</WidgetFrame>
