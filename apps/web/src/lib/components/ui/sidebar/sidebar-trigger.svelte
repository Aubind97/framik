<script lang="ts">
import PanelLeftIcon from "@lucide/svelte/icons/panel-left";
import type { ComponentProps } from "svelte";
import { Button } from "$lib/components/ui/button/index.ts";
import { cn } from "$lib/utils.ts";
import { useSidebar } from "./context.svelte.ts";

let {
	ref = $bindable(null),
	class: className,
	onclick,
	...restProps
}: ComponentProps<typeof Button> & {
	onclick?: (e: MouseEvent) => void;
} = $props();

const sidebar = useSidebar();
</script>

<Button
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="icon"
	class={cn("size-7", className)}
	type="button"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<PanelLeftIcon />
	<span class="sr-only">Toggle Sidebar</span>
</Button>
