<script lang="ts">
import { RotateCw } from "@lucide/svelte";
import { toast } from "svelte-sonner";
import { refreshDaemonFrame } from "$lib/api/fetch/daemon";
import { Button } from "$lib/components/ui/button";
import type { Frame } from "$lib/server/db/types";

let { frame }: { frame: Frame | undefined } = $props();

let isProcessing = $state(false);

async function handleRefresh() {
	if (frame) {
		isProcessing = true;
		const { error } = await refreshDaemonFrame({ daemonUrl: frame.apiUrl });

		if (error?.name) {
			toast.error(error?.name);
			isProcessing = false;
			return;
		}

		isProcessing = false;
		toast.success(`Frame "${frame.name}" refreshed`);
	}
}
</script>

<Button variant="outline" disabled={frame === undefined || isProcessing} onclick={handleRefresh}>
    <RotateCw/>
</Button>
