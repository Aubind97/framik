<script>
import { mode } from "mode-watcher";
import WidgetItem from "#lib/components/widgets/core/widget-item.svelte";
import { WIDGETS } from "#lib/constants.ts";
</script>

{#each Object.entries(WIDGETS) as [id, widget] (id) }
    <WidgetItem id={id} logo={mode.current === 'dark'? widget.logoDark : widget.logoLight} name={widget.name} description={widget.description} disabled={widget.disabled} />
{/each}
