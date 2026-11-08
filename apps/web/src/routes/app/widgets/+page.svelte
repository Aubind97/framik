<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { mode } from "mode-watcher";
import { getImmichIntegrationQueryOptions } from "#lib/api/fetch/immich.ts";
import WidgetItem from "#lib/components/widgets/core/widget-item.svelte";
import { INTEGRATIONS, WIDGETS } from "#lib/constants.ts";

const immichIntegrationQuery = createQuery(() => getImmichIntegrationQueryOptions());

function getLock(requires: keyof typeof INTEGRATIONS | undefined) {
	if (requires !== "immich" || !immichIntegrationQuery.isSuccess || immichIntegrationQuery.data.connected) return undefined;
	const integration = INTEGRATIONS[requires];
	return { message: `Connect ${integration.name} in your account settings to unlock this widget`, href: integration.settingsUrl };
}
</script>

<svelte:head>
    <title>Widgets · Framik</title>
</svelte:head>

{#each Object.entries(WIDGETS) as [id, widget] (id) }
    <WidgetItem id={id} logo={mode.current === 'dark'? widget.logoDark : widget.logoLight} name={widget.name} description={widget.description} disabled={widget.disabled} locked={getLock(widget.requires)} />
{/each}
