<script lang="ts">
import { onMount } from "svelte";
import * as Select from "$lib/components/ui/select/index";
import type { Frame } from "$lib/server/db/types";

let { frames = [], handleChange }: { frames?: Frame[]; handleChange?: (frame: Frame | undefined) => void } = $props();
let selectedId = $state<string | undefined>(undefined);

const storedCurrentFrameIdKey = "FRAMIK_CURRENT_FRAME_ID";

const selectedFrame = $derived(frames.find((f) => f.id === selectedId));
const triggerContent = $derived(selectedFrame?.name ?? "Select a frame");

$effect(() => {
	handleChange?.(selectedFrame);

	if (selectedFrame) {
		localStorage.setItem(storedCurrentFrameIdKey, selectedFrame?.id ?? null);
	}
});

onMount(() => {
	const lastFrameSelectedId = localStorage.getItem(storedCurrentFrameIdKey);
	selectedId = lastFrameSelectedId ?? undefined;
});
</script>

<Select.Root type="single" name="favoriteFruit" bind:value={selectedId} >
<Select.Trigger class="w-[180px]">
  {triggerContent}
</Select.Trigger>
<Select.Content>
  <Select.Group>
    <Select.Label>Frames</Select.Label>
    {#each frames as frame (frame.id)}
      <Select.Item
        value={frame.id}
        label={frame.name}
      >
        {frame.name}
      </Select.Item>
    {/each}
  </Select.Group>
</Select.Content>
</Select.Root>
