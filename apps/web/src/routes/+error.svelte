<script>
import { Binoculars } from "@lucide/svelte";
import { page } from "$app/state";
import { Button } from "$lib/components/ui/button";
</script>

<div class="h-screen flex flex-col gap-4 items-center justify-center">
    <Binoculars size={64} class="text-muted" />
    <h1 class="text-2xl font-bold">{page.error?.message ?? 'Error'} - {page.status}</h1>
    <p class="text-muted-foreground">There is an error while accessing to this page</p>
    <a href="/">
        <Button type="button">Go to the dashboard</Button>
    </a>
</div>
