<script lang="ts">
import { SendHorizontal } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { toast } from "svelte-sonner";
import { pushDaemonFrame } from "$lib/api/fetch/daemon";
import { getAllFramesQueryOptions } from "$lib/api/fetch/frame";
import { useActiveOrganization } from "$lib/auth-client";
import { Button } from "$lib/components/ui/button";
import FrameClearControl from "$lib/components/utils/frame-clear-control.svelte";
import FrameRefreshControl from "$lib/components/utils/frame-refresh-control.svelte";
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
</script>

<header class="flex justify-end items-center gap-2">
    <FrameSelector frames={framesQuery?.data ?? undefined} {handleChange} />
    <FrameClearControl frame={selectedFrame} />
    <FrameRefreshControl frame={selectedFrame} />
    <Button variant="default" disabled={selectedFrame === undefined || isProcessing || !loadedImage} onclick={handlePush}>
        <SendHorizontal />
    </Button>
</header>
