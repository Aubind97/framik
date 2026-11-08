<script lang="ts">
import WidgetFrame from "#lib/components/widgets/core/widget-frame.svelte";
import WidgetRenderer from "#lib/components/widgets/core/widget-renderer.svelte";

const {
	image,
	showProcessedPreview,
	emptyLabel,
	frameClass,
	rendererClass,
}: { image: string | null | undefined; showProcessedPreview: boolean; emptyLabel?: string; frameClass?: string; rendererClass?: string } = $props();
</script>

<WidgetFrame class={frameClass}>
    <WidgetRenderer {image} {showProcessedPreview} {emptyLabel} class={rendererClass}/>
</WidgetFrame>
