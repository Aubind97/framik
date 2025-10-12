<script lang="ts">
import { Construction } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { getOnFrameImageQueryOption } from "$lib/api/fetch/daemon";
import FrameControls from "$lib/components/utils/frame-controls.svelte";
import Widget from "$lib/components/widgets/core/widget.svelte";
import { type Frame } from "$lib/server/db/types";

let selectedFrame = $state<Frame | undefined>(undefined);

const currentImageQuery = createQuery(() => ({
	// biome-ignore  lint/style/noNonNullAssertion: It's always defined because of the enabled clause
	...getOnFrameImageQueryOption({ daemonUrl: selectedFrame?.apiUrl! }),
	select: (response) => response.data,
	enabled: selectedFrame?.apiUrl !== undefined,
}));

function handleSelectedFrame(frame: Frame | undefined) {
	selectedFrame = frame;
}
</script>

<div class="h-full flex flex-col gap-4">
    <FrameControls onSelectedFrame={handleSelectedFrame} />

    <div class="w-full grid lg:grid-cols-[1fr] gap-4">
    <Widget image={currentImageQuery.data ?? undefined} showProcessedPreview={false} />
    </div>
</div>
