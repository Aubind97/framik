<script lang="ts">
import { Plug, Plus, Save, Trash2, Unplug } from "@lucide/svelte";
import { createForm } from "@tanstack/svelte-form";
import { Button } from "#lib/components/ui/button/index.ts";
import { Input } from "#lib/components/ui/input/index.ts";
import Label from "#lib/components/ui/label/label.svelte";
import { IMMICH_API_KEY_PERMISSIONS } from "#lib/immich.ts";
import { createImmichIntegrationSchema, type ImmichIntegrationFormValue } from "./utils/schemas";
import TextField from "./utils/text-field.svelte";

type Action = "save" | "test";

const {
	stored,
	handleSave,
	handleTest,
	handleDisconnect,
}: {
	stored: { url: string; apiKeySet: boolean; headerNames: string[] } | null;
	handleSave: (formValue: ImmichIntegrationFormValue) => Promise<void>;
	handleTest: (formValue: ImmichIntegrationFormValue) => Promise<void>;
	handleDisconnect: () => Promise<void>;
} = $props();
const id = $props.id();

const STORED_PLACEHOLDER = "•••••••• (unchanged)";

const form = createForm(() => ({
	defaultValues: {
		url: stored?.url ?? "",
		apiKey: "",
		headers: (stored?.headerNames ?? []).map((name) => ({ name, value: "" })),
	} as ImmichIntegrationFormValue,
	validators: { onSubmit: createImmichIntegrationSchema({ apiKeySet: stored?.apiKeySet ?? false, headerNames: stored?.headerNames ?? [] }) },
	onSubmitMeta: { action: "save" as Action },
	onSubmit: async ({ value, meta }) => {
		await (meta.action === "test" ? handleTest(value) : handleSave(value));
	},
}));

function isStoredHeader(name: string) {
	return stored?.headerNames.some((storedName) => storedName.toLowerCase() === name.trim().toLowerCase()) ?? false;
}
</script>

<form
  id="form-{id}"
  class="flex flex-col gap-6"
  onsubmit={(e) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit({ action: "save" })
  }}
>
  <div class="grid gap-3">
    <form.Field name="url">
      {#snippet children(field)}
        <TextField
          name={field.name}
          type="url"
          label="Server URL"
          placeholder="https://photos.example.com"
          value={field.state.value}
          handleBlur={field.handleBlur}
          handleChange={field.handleChange}
          errors={field.state.meta.errors}
        />
      {/snippet}
    </form.Field>

    <form.Field name="apiKey">
      {#snippet children(field)}
        <TextField
          name={field.name}
          type="password"
          label="API key"
          placeholder={stored?.apiKeySet ? STORED_PLACEHOLDER : "Create one in Immich under Account Settings > API Keys"}
          required={!stored?.apiKeySet}
          value={field.state.value}
          handleBlur={field.handleBlur}
          handleChange={field.handleChange}
          errors={field.state.meta.errors}
        />
      {/snippet}
    </form.Field>

    <div class="rounded-md border bg-muted/40 p-3 text-sm">
      <p class="text-muted-foreground">When creating the key in Immich, grant these permissions:</p>
      <ul class="mt-2 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
        {#each IMMICH_API_KEY_PERMISSIONS as permission (permission.name)}
          <li class="col-span-2 grid grid-cols-subgrid">
            <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{permission.name}</code>
            <span class="text-muted-foreground">{permission.usage}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <form.Field name="headers" mode="array">
    {#snippet children(headersField)}
      <div class="grid gap-3">
        <div>
          <Label>Custom proxy headers</Label>
          <p class="text-sm text-muted-foreground">Sent with every request to Immich, e.g. to get through an authenticating reverse proxy like Pangolin.</p>
        </div>

        {#each headersField.state.value as _, index (index)}
          <div class="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
            <form.Field name={`headers[${index}].name`}>
              {#snippet children(field)}
                <div class="grid gap-1">
                  <Input
                    aria-label="Header name"
                    placeholder="Header name"
                    value={field.state.value}
                    aria-invalid={!!field.state.meta.errors.length}
                    onblur={field.handleBlur}
                    oninput={(e: Event) => field.handleChange((e.target as HTMLInputElement).value)}
                  />
                  {#each field.state.meta.errors as error}
                    <p class="text-destructive text-sm">{error?.message}</p>
                  {/each}
                </div>
              {/snippet}
            </form.Field>
            <form.Field name={`headers[${index}].value`}>
              {#snippet children(field)}
                <div class="grid gap-1">
                  <Input
                    type="password"
                    aria-label="Header value"
                    placeholder={isStoredHeader(headersField.state.value[index]?.name ?? "") ? STORED_PLACEHOLDER : "Header value"}
                    value={field.state.value}
                    aria-invalid={!!field.state.meta.errors.length}
                    onblur={field.handleBlur}
                    oninput={(e: Event) => field.handleChange((e.target as HTMLInputElement).value)}
                  />
                  {#each field.state.meta.errors as error}
                    <p class="text-destructive text-sm">{error?.message}</p>
                  {/each}
                </div>
              {/snippet}
            </form.Field>
            <Button variant="ghost" size="icon" aria-label="Remove header" onclick={() => headersField.removeValue(index)}>
              <Trash2 />
            </Button>
          </div>
        {/each}

        <Button variant="outline" class="justify-self-start" onclick={() => headersField.pushValue({ name: "", value: "" })}>
          <Plus />
          Add header
        </Button>
      </div>
    {/snippet}
  </form.Field>

  <form.Subscribe selector={(state) => state.isSubmitting}>
    {#snippet children(isSubmitting)}
      <div class="flex flex-wrap gap-2 justify-end">
        {#if stored}
          <Button variant="destructive" class="mr-auto" disabled={isSubmitting} onclick={handleDisconnect}>
            <Unplug />
            Disconnect
          </Button>
        {/if}
        <Button variant="secondary" disabled={isSubmitting} onclick={() => form.handleSubmit({ action: "test" })}>
          <Plug />
          Test connection
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save />
          Save
        </Button>
      </div>
    {/snippet}
  </form.Subscribe>
</form>
