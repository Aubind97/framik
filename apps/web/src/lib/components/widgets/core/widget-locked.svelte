<script lang="ts">
import { Lock, Settings } from "@lucide/svelte";
import { Button } from "#lib/components/ui/button/index.ts";
import { INTEGRATIONS } from "#lib/constants.ts";

const { integration }: { integration: keyof typeof INTEGRATIONS } = $props();

const { name, settingsUrl } = $derived(INTEGRATIONS[integration]);
</script>

<div class="flex-1 w-full flex flex-col gap-4 items-center justify-center text-center bg-muted rounded-md p-8 text-muted-foreground">
    <Lock size={48} />
    <div class="flex flex-col gap-1">
        <h2 class="text-xl font-bold text-foreground">This widget is locked</h2>
        <p>Connect your {name} server in your account settings to use it.</p>
    </div>
    <Button href={settingsUrl}>
        <Settings />
        Go to account settings
    </Button>
</div>
