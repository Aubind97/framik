<script lang="ts">
import { type Snippet } from "svelte";
import { cn } from "#lib/utils.ts";

let { children, class: className }: { children?: Snippet; class?: string } = $props();
</script>

<div class={cn("border p-8 lg:p-16 rounded h-full", className)}>
    {@render children?.()}
</div>
