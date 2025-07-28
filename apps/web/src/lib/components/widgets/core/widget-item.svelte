<script lang="ts">
import { ArrowRight, Frame } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";

const { id, name, description, logo }: { id: string; name: string; description: string; logo?: string } = $props();
</script>

<a href="/app/widgets/{id}">
    <article class="flex gap-4 border p-4 rounded items-center hover:bg-muted">
        {#if logo}
            <img alt="{name} Logo" src={logo} class="size-8"/>
        {:else}
            <Frame size={32} />
        {/if}

        <div class="flex flex-col flex-1">
        <h1 class="font-bold">{name}</h1>
        <p class="text-muted-foreground line-clamp-1">{description}</p>
        </div>

        <ArrowRight />
    </article>
</a>
