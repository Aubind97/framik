<script lang="ts">
import { BrushCleaning } from "@lucide/svelte";
import { toast } from "svelte-sonner";
import { clearDaemonFrame } from "$lib/api/fetch/daemon";
import { Button } from "$lib/components/ui/button";
import type { Frame } from "$lib/server/db/types";

let { frame }: { frame: Frame | undefined } = $props();

let isProcessing = $state(false);

async function handleClear() {
	if (frame) {
		isProcessing = true;
		const { error } = await clearDaemonFrame({ daemonUrl: frame.apiUrl });

		if (error?.name) {
			toast.error(error?.name);
			isProcessing = false;
			return;
		}

		isProcessing = false;
		toast.success(`Frame "${frame.name}" cleared`);
	}
}
</script>

<Button variant="outline" disabled={frame === undefined || isProcessing} onclick={handleClear}>
    <BrushCleaning/>
</Button>
