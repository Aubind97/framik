<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { getImmichIntegrationQueryOptions } from "#lib/api/fetch/immich.ts";
import { Skeleton } from "#lib/components/ui/skeleton/index.ts";
import FrameControls from "#lib/components/utils/frame-controls.svelte";
import WidgetLocked from "#lib/components/widgets/core/widget-locked.svelte";
import ImmichWidget from "#lib/components/widgets/immich/widget.svelte";
import { WIDGETS } from "#lib/constants.ts";

let loadedImage = $state<string | undefined>(undefined);

const WIDGET = WIDGETS.immich;

const integrationQuery = createQuery(() => getImmichIntegrationQueryOptions());
</script>

<div class="h-full flex flex-col gap-4">
    <div class="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div class="flex items-center gap-4">
            <img alt="{WIDGET.name} Logo" src={WIDGET.logoLight} class="size-8"/>
            <div>
                <h1 class="text-xl font-bold">{WIDGET.name}</h1>
                <p class="text-muted-foreground">{WIDGET.description}</p>
            </div>
        </div>

        {#if integrationQuery.data?.connected}
            <FrameControls {loadedImage}/>
        {/if}
    </div>

    {#if integrationQuery.isPending}
        <Skeleton class="flex-1 w-full" />
    {:else if integrationQuery.isError}
        <p class="text-destructive">{integrationQuery.error.message}</p>
    {:else if !integrationQuery.data.connected}
        <WidgetLocked integration="immich" />
    {:else}
        <ImmichWidget handleImageLoad={(image) => (loadedImage = image)} />
    {/if}
</div>
