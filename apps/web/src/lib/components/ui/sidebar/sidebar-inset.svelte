<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef } from "$lib/utils.ts";

let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<main
	bind:this={ref}
	data-slot="sidebar-inset"
	class={cn(
		"bg-background relative flex w-full flex-1 flex-col",
		"md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</main>
