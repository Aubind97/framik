<script lang="ts">
import { Construction } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { getOnFrameImageQueryOption } from "#lib/api/fetch/daemon.ts";
import FrameControls from "#lib/components/utils/frame-controls.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import { type Frame } from "#lib/server/db/types.ts";

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

<svelte:head>
    <title>Home · Framik</title>
</svelte:head>

<div class="flex-1 flex flex-col gap-4">
    <FrameControls onSelectedFrame={handleSelectedFrame} />

    <div class="flex-1 flex flex-col justify-center lg:justify-start">
        <!-- auto height so the frame keeps its aspect ratio instead of stretching -->
        <div>
            <Widget image={currentImageQuery.data ?? undefined} showProcessedPreview={false} />
        </div>
    </div>
</div>
