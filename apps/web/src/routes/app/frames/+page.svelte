<script lang="ts">
import { Plus } from "@lucide/svelte";
import { createQueries, createQuery } from "@tanstack/svelte-query";
import { getDaemonFrameStatusQueryOptions } from "$lib/api/fetch/daemon";
import { getAllFramesQueryOptions } from "$lib/api/fetch/frame";
import { useActiveOrganization } from "$lib/auth-client";
import FrameTable from "$lib/components/tables/frame.table.svelte";
import Button from "$lib/components/ui/button/button.svelte";

let activeOrganization = useActiveOrganization();

let organizationId = $derived($activeOrganization.data?.id);

let framesStatus = $state<Record<string, { online: boolean; version?: string }>>({});

const framesQuery = $derived(
	createQuery({
		// biome-ignore lint/style/noNonNullAssertion: can't be null since the query will be disabled
		...getAllFramesQueryOptions({ organizationId: organizationId! }),
		select: (frames) => frames.data,
		enabled: !!organizationId,
	}),
);

const frameStatus = $derived(
	createQueries({
		queries: ($framesQuery.data ?? []).map((frame) => {
			const queryOption = getDaemonFrameStatusQueryOptions({ daemonUrl: frame.apiUrl });
			return { ...queryOption, select: (status: Awaited<ReturnType<(typeof queryOption)["queryFn"]>>) => ({ status: status.data, frame }) };
		}),
	}),
);

$effect(() => {
	frameStatus.subscribe((allStatus) => {
		for (const status of allStatus) {
			const frameId = status.data?.frame.id;
			if (frameId) {
				framesStatus[frameId] = { online: status.data?.status?.online ?? false, version: status.data?.status?.version ?? undefined };
			}
		}
	});
});
</script>

<div class="h-full flex flex-col gap-2">
    <header class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Frames</h1>

    <Button href="/app/frames/create">
        <Plus />
        Create a frame</Button>
    </header>

    <FrameTable frames={$framesQuery?.data ?? undefined} {framesStatus} />
</div>
