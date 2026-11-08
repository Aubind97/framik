<script lang="ts">
import { ArrowRight, Frame, Lock, Settings } from "@lucide/svelte";
import { Button } from "#lib/components/ui/button/index.ts";

const {
	id,
	name,
	description,
	logo,
	disabled,
	locked,
}: { id: string; name: string; description: string; logo?: string; disabled?: boolean; locked?: { message: string; href: string } } = $props();
</script>

{#snippet logoImage()}
    {#if typeof logo === "string"}
        <img alt="{name} Logo" src={logo} class="size-8 {locked ? 'grayscale opacity-60' : ''}"/>
    {:else}
        <Frame size={32} />
    {/if}
{/snippet}

{#if locked}
    <article class="flex gap-4 border border-dashed p-4 rounded items-center bg-muted/40">
        {@render logoImage()}

        <div class="flex flex-col flex-1 min-w-0">
            <h1 class="font-bold flex items-center gap-2">{name} <Lock class="size-4 text-muted-foreground" aria-label="Locked" /></h1>
            <p class="text-muted-foreground line-clamp-1">{locked.message}</p>
        </div>

        <Button href={locked.href} variant="secondary" size="sm">
            <Settings />
            Set up
        </Button>
    </article>
{:else}
    <a href="/app/widgets/{id}" class="{disabled ? 'pointer-events-none opacity-30 bg-muted': ''}">
        <article class="flex gap-4 border p-4 rounded items-center hover:bg-muted">
            {@render logoImage()}

            <div class="flex flex-col flex-1">
            <h1 class="font-bold">{name}</h1>
            <p class="text-muted-foreground line-clamp-1">{description}</p>
            </div>

            <ArrowRight />
        </article>
    </a>
{/if}
