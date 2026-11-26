<script lang="ts">
import { SendHorizontal } from "@lucide/svelte";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import { toast } from "svelte-sonner";
import { pushDaemonFrame } from "#lib/api/fetch/daemon.ts";
import { getAllFramesQueryOptions, scheduleFrame } from "#lib/api/fetch/frame.ts";
import { getErrorMessage } from "#lib/api/fetch/index.ts";
import { useActiveOrganization } from "#lib/auth-client.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import FrameClearControl from "#lib/components/utils/frame-clear-control.svelte";
import FrameRefreshControl from "#lib/components/utils/frame-refresh-control.svelte";
import FrameSelector from "#lib/components/utils/frame-selector.svelte";
import { type ScheduledWidget, scheduleRefresh } from "#lib/schedule.ts";
import type { Frame } from "#lib/server/db/types.ts";

let {
	loadedImage,
	schedule,
	onSelectedFrame,
}: {
	loadedImage?: string | undefined;
	schedule?: ScheduledWidget | undefined;
	onSelectedFrame?: (frame: Frame | undefined) => void;
} = $props();

const queryClient = useQueryClient();
const refresh = $derived(schedule && scheduleRefresh(schedule));

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

async function handleSchedule(frame: Frame, body: NonNullable<typeof schedule>) {
	isProcessing = true;
	const { error } = await scheduleFrame(frame.id, body);
	isProcessing = false;
	await queryClient.invalidateQueries({ queryKey: ["frames", frame.id, "schedule"] });

	if (error) toast.error(getErrorMessage(error));
	else toast.success(`"${frame.name}" updated, refreshed ${refresh?.toLowerCase()}`);
}

async function handlePush() {
	if (selectedFrame && schedule) return handleSchedule(selectedFrame, schedule);
	if (selectedFrame && loadedImage) {
		isProcessing = true;
		const { error } = await pushDaemonFrame({
			daemonUrl: selectedFrame.apiUrl,
			frameId: selectedFrame.id,
			image: loadedImage,
		});

		if (error?.name) {
			toast.error(error?.name);
			isProcessing = false;
			return;
		}

		isProcessing = false;
		await queryClient.invalidateQueries({ queryKey: ["frames", selectedFrame.id, "schedule"] });
		toast.success(`Image pushed to "${selectedFrame.name}"`);
	}
}

$effect(() => {
	onSelectedFrame?.(selectedFrame);
});
</script>

<header class="flex justify-end items-center gap-2">
    <FrameSelector frames={framesQuery?.data ?? undefined} {handleChange} />
    <FrameClearControl frame={selectedFrame} />
    <FrameRefreshControl frame={selectedFrame} />
    <Button
        variant="default"
        disabled={selectedFrame === undefined || isProcessing || !(loadedImage || schedule)}
        onclick={handlePush}
        title={refresh ? `Push now and refresh ${refresh.toLowerCase()}` : "Push"}
    >
        <SendHorizontal />
        {refresh}
    </Button>
</header>
