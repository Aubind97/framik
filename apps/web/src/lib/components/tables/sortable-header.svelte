<script lang="ts">
import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
import type { ComponentProps } from "svelte";
import { Button } from "$lib/components/ui/button";

let { name, variant = "ghost", ...restProps }: ComponentProps<typeof Button> & { name: string } = $props();
</script>

<div class="flex items-center gap-1">
  {name}
  <Button {variant} {...restProps}>
    <ArrowUpDownIcon />
  </Button>
</div>
