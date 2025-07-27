<script lang="ts">
import { BrushCleaning, SendHorizontal } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { toast } from "svelte-sonner";
import { clearDaemonFrame, pushDaemonFrame } from "$lib/api/fetch/daemon";
import { getAllFramesQueryOptions } from "$lib/api/fetch/frame";
import { useActiveOrganization } from "$lib/auth-client";
import { Button } from "$lib/components/ui/button";
import FrameSelector from "$lib/components/utils/frame-selector.svelte";
import UnsplashImageWidget from "$lib/components/widgets/unsplash-image/widget.svelte";
import { SCREENS } from "$lib/constants";
import type { Frame } from "$lib/server/db/types";

let activeOrganization = useActiveOrganization();

let organizationId = $derived($activeOrganization.data?.id);
let selectedFrame = $state<Frame | undefined>(undefined);
let isProcessing = $state(false);

const framesQuery = $derived(
	createQuery({
		// biome-ignore lint/style/noNonNullAssertion: can't be null since the query will be disabled
		...getAllFramesQueryOptions({ organizationId: organizationId! }),
		select: (frames) => frames.data,
		enabled: !!organizationId,
	}),
);

function handleChange(frame: Frame | undefined) {
	selectedFrame = frame;
}

async function handlePush() {
	if (selectedFrame) {
		isProcessing = true;
		const { error } = await pushDaemonFrame({
			daemonUrl: selectedFrame.apiUrl,
			// TMP: replace with current loaded widget
			orientation: "landscape",
			widgetURL: `https://picsum.photos/${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.width}/${SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.height}`,
		});

		if (error?.name) {
			toast.error(error?.name);
			isProcessing = false;
			return;
		}

		isProcessing = false;
		toast.success(`Image pushed to "${selectedFrame.name}"`);
	}
}

async function handleClear() {
	if (selectedFrame) {
		isProcessing = true;
		const { error } = await clearDaemonFrame({ daemonUrl: selectedFrame.apiUrl });

		if (error?.name) {
			toast.error(error?.name);
			isProcessing = false;
			return;
		}

		isProcessing = false;
		toast.success(`Frame "${selectedFrame.name}" cleared`);
	}
}
</script>

<div class="h-full flex flex-col gap-4">
    <header class="flex justify-end items-center gap-2">
        <FrameSelector frames={$framesQuery?.data ?? undefined} {handleChange} />
        <Button variant="outline" disabled={selectedFrame === undefined || isProcessing} onclick={handleClear}>
            <BrushCleaning/>
        </Button>
        <Button variant="default" disabled={selectedFrame === undefined || isProcessing} onclick={handlePush}>
            <SendHorizontal />
        </Button>
    </header>
    <div class="flex-1 flex flex-col items-center justify-center">
        <div class="w-full lg:w-2/3">
            <UnsplashImageWidget />
        </div>
    </div>
</div>
