<script lang="ts">
import { Plus } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { getAllFramesQueryOptions } from "$lib/api/fetch/frame";
import { useActiveOrganization } from "$lib/auth-client";
import Button from "$lib/components/ui/button/button.svelte";

let activeOrganization = useActiveOrganization();

let organizationId = $derived($activeOrganization.data?.id);

const query = $derived(
	createQuery({
		// biome-ignore lint/style/noNonNullAssertion: can't be null since the query will be disabled
		...getAllFramesQueryOptions({ organizationId: organizationId! }),
		enabled: !!organizationId,
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
        {#each ($query?.data?.data ?? []) as frame}
            <li>{frame.name}</li>
        {/each}
    </ul>
</div>
