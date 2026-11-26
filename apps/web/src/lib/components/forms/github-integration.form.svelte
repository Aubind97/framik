<script lang="ts">
import { ExternalLink, Save, Unplug } from "@lucide/svelte";
import { Button } from "#lib/components/ui/button/index.ts";
import { Input } from "#lib/components/ui/input/index.ts";
import Label from "#lib/components/ui/label/label.svelte";
import { GITHUB_TOKEN_PERMISSIONS, GITHUB_TOKEN_URL } from "#lib/github.ts";

const {
	login,
	handleSave,
	handleDisconnect,
}: {
	login: string | null;
	handleSave: (token: string) => Promise<void>;
	handleDisconnect: () => Promise<void>;
} = $props();
const id = $props.id();

let token = $state("");
let isSubmitting = $state(false);

async function run(action: () => Promise<void>) {
	isSubmitting = true;
	await action();
	isSubmitting = false;
}
</script>

<form
  class="flex flex-col gap-6"
  onsubmit={(e) => {
    e.preventDefault()
    run(() => handleSave(token.trim()))
  }}
>
  <div class="grid gap-3">
    <div class="grid gap-2">
      <Label for="{id}-token">Personal access token</Label>
      <Input
        id="{id}-token"
        type="password"
        autocomplete="off"
        placeholder={login ? `•••••••• (connected as ${login})` : "github_pat_…"}
        bind:value={token}
      />
    </div>

    <div class="rounded-md border bg-muted/40 p-3 text-sm">
      <p class="text-muted-foreground">
        Create a <a class="underline inline-flex items-center gap-1" href={GITHUB_TOKEN_URL} target="_blank" rel="noreferrer">fine-grained token <ExternalLink class="size-3" /></a>
        with access to the repositories you want to show, and these <strong>read-only</strong> permissions:
      </p>
      <ul class="mt-2 grid grid-cols-[auto_auto_1fr] items-baseline gap-x-3 gap-y-1">
        {#each GITHUB_TOKEN_PERMISSIONS as permission (permission.name)}
          <li class="col-span-3 grid grid-cols-subgrid">
            <span class="text-muted-foreground text-xs">{permission.scope}</span>
            <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{permission.name}</code>
            <span class="text-muted-foreground">{permission.usage}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="flex flex-wrap gap-2 justify-end">
    {#if login}
      <Button variant="destructive" class="mr-auto" disabled={isSubmitting} onclick={() => run(handleDisconnect)}>
        <Unplug />
        Disconnect
      </Button>
    {/if}
    <Button type="submit" disabled={isSubmitting || !token.trim()}>
      <Save />
      Save
    </Button>
  </div>
</form>
