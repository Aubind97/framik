<script lang="ts">
import { Trash2 } from "@lucide/svelte";
import { useQueryClient } from "@tanstack/svelte-query";
import { AlertDialog } from "bits-ui";
import { toast } from "svelte-sonner";
import { deleteFrame } from "#lib/api/fetch/frame.ts";
import { buttonVariants } from "#lib/components/ui/button/index.ts";
import type { Frame } from "#lib/server/db/types.ts";

let { frame }: { frame: Frame } = $props();

const queryClient = useQueryClient();

let open = $state(false);
let isProcessing = $state(false);

async function handleDelete() {
	isProcessing = true;
	const { error } = await deleteFrame(frame.id);
	isProcessing = false;

	if (error) {
		toast.error(`Failed to delete frame "${frame.name}"`);
		return;
	}

	open = false;
	toast.success(`Frame "${frame.name}" deleted`);
	await queryClient.invalidateQueries({ queryKey: ["frames", frame.organizationId] });
}
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Trigger class={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={`Delete frame ${frame.name}`}>
        <Trash2 />
    </AlertDialog.Trigger>
    <AlertDialog.Portal>
        <AlertDialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
        <AlertDialog.Content class="bg-background fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg">
            <AlertDialog.Title class="text-lg font-semibold">Delete "{frame.name}"?</AlertDialog.Title>
            <AlertDialog.Description class="text-muted-foreground text-sm">This cannot be undone.</AlertDialog.Description>
            <div class="flex justify-end gap-2">
                <AlertDialog.Cancel class={buttonVariants({ variant: "outline" })}>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action class={buttonVariants({ variant: "destructive" })} disabled={isProcessing} onclick={handleDelete}>Delete</AlertDialog.Action>
            </div>
        </AlertDialog.Content>
    </AlertDialog.Portal>
</AlertDialog.Root>
