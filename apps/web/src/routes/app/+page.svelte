<script>
import { Construction } from "@lucide/svelte";
import FrameControls from "$lib/components/utils/frame-controls.svelte";
</script>

<div class="h-full flex flex-col gap-4">
    <FrameControls />
    <div class="flex-1 flex flex-col gap-4 items-center justify-center bg-muted rounded-md text-muted-foreground">
        <Construction size={64} />
        <h1 class="text-2xl font-bold">Home</h1>
        <ul class="list-disc">
            <li>Show the frame status</li>
        </ul>
    </div>
</div>
