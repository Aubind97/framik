<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef } from "$lib/utils.js";

let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<caption
	bind:this={ref}
	data-slot="table-caption"
	class={cn("text-muted-foreground mt-4 text-sm", className)}
	{...restProps}
>
	{@render children?.()}
</caption>
