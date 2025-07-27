<script lang="ts">
import { Construction, Plus } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { useActiveOrganization } from "$lib/auth-client";
import Button from "$lib/components/ui/button/button.svelte";

let activeOrganization = useActiveOrganization();

let organizationId = $derived($activeOrganization.data?.id);

const query = $derived(
	createQuery({
		queryKey: ["frames", organizationId],
		queryFn: async () => (await fetch(`/api/frames?organizationId=${organizationId}`)).json(),
	}),
);
</script>

<div class="h-full flex flex-col gap-2">
    <header class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Frames</h1>

    <Button href="/app/frames/create">
        <Plus />
        Create a frame</Button>
    </header>

    <ul>
        {#each $query.data as frame}
            <li>{frame.name}</li>
        {/each}
    </ul>

    <div class="flex-1 flex flex-col gap-4 items-center justify-center bg-muted rounded-md text-muted-foreground">
        <Construction size={64} />
        <ul class="list-disc">
            <li>List all connected frames</li>
            <li>Show all frame info <i>(version, screen, connection status)</i></li>
        </ul>
    </div>
</div>
