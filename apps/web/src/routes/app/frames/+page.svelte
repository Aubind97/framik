<script>
import { Construction } from "@lucide/svelte";
</script>

<div class="h-full flex flex-col gap-4 items-center justify-center">
    <Construction size={64} class="text-muted" />
    <h1 class="text-2xl font-bold">Frames</h1>
    <ul class="list-disc">
        <li>List all connected frames</li>
        <li>Show all frame info <i>(version, screen, connection status)</i></li>
    </ul>
</div>
