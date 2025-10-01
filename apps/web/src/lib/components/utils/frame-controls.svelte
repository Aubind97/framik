<script lang="ts">
import { BrushCleaning, RotateCw, SendHorizontal } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { toast } from "svelte-sonner";
import { clearDaemonFrame, pushDaemonFrame, refreshDaemonFrame } from "$lib/api/fetch/daemon";
import { getAllFramesQueryOptions } from "$lib/api/fetch/frame";
import { useActiveOrganization } from "$lib/auth-client";
import { Button } from "$lib/components/ui/button";
import FrameSelector from "$lib/components/utils/frame-selector.svelte";
import type { Frame } from "$lib/server/db/types";

let { loadedImage }: { loadedImage?: string | undefined } = $props();

let activeOrganization = useActiveOrganization();

let organizationId = $derived($activeOrganization.data?.id);
let selectedFrame = $state<Frame | undefined>(undefined);
let isProcessing = $state(false);

const framesQuery = createQuery(() => ({
	// biome-ignore lint/style/noNonNullAssertion: can't be null since the query will be disabled
	...getAllFramesQueryOptions({ organizationId: organizationId! }),
	select: (frames) => frames.data,
	enabled: !!organizationId,
}));

function handleChange(frame: Frame | undefined) {
	selectedFrame = frame;
}

async function handlePush() {
	if (selectedFrame && loadedImage) {
		isProcessing = true;
		const { error } = await pushDaemonFrame({
			daemonUrl: selectedFrame.apiUrl,
			image: loadedImage,
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

async function handleRefresh() {
	if (selectedFrame) {
		isProcessing = true;
		const { error } = await refreshDaemonFrame({ daemonUrl: selectedFrame.apiUrl });

		if (error?.name) {
			toast.error(error?.name);
			isProcessing = false;
			return;
		}

		isProcessing = false;
		toast.success(`Frame "${selectedFrame.name}" refreshed`);
	}
}
</script>

<header class="flex justify-end items-center gap-2">
    <FrameSelector frames={framesQuery?.data ?? undefined} {handleChange} />
    <Button variant="outline" disabled={selectedFrame === undefined || isProcessing} onclick={handleClear}>
        <BrushCleaning/>
    </Button>
    <Button variant="outline" disabled={selectedFrame === undefined || isProcessing} onclick={handleRefresh}>
        <RotateCw/>
    </Button>
    <Button variant="default" disabled={selectedFrame === undefined || isProcessing || !loadedImage} onclick={handlePush}>
        <SendHorizontal />
    </Button>
</header>
