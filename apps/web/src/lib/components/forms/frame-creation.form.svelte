<script lang="ts">
import { createForm } from "@tanstack/svelte-form";
import type { HTMLAttributes } from "svelte/elements";
import { Button } from "$lib/components/ui/button/index.ts";
import { cn, type WithElementRef } from "$lib/utils.ts";
import { type FrameCreationFormValue, frameCreationSchema, type OrganizationCreationFormValue, organizationCreationSchema, signInSchema } from "./utils/schemas";
import TextField from "./utils/text-field.svelte";

let {
	ref = $bindable(null),
	class: className,
	handleSubmit,
	...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { handleSubmit?: (formValue: FrameCreationFormValue) => Promise<void> } = $props();
const id = $props.id();

const DEFAULT_VALUES = {
	name: "",
	apiUrl: "",
};

const form = createForm(() => ({
	defaultValues: DEFAULT_VALUES,
	validators: { onSubmit: frameCreationSchema },
	onSubmit: async ({ value }) => {
		await handleSubmit?.(value);
	},
}));
</script>

<div class={cn("flex flex-col gap-6", className)} bind:this={ref} {...restProps}>
    <form
      id="form-{id}"
      onsubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >

      <div class="flex flex-col gap-6">
        <div class="grid gap-3">
            <form.Field name="name">
              {#snippet children(field)}
                <TextField
                    name={field.name}
                    type="text"
                    label="Frame name"
                    placeholder="Enter a name..."
                    value={field.state.value}
                    handleBlur={field.handleBlur}
                    handleChange={field.handleChange}
                    errors={field.state.meta.errors}
                />
              {/snippet}
            </form.Field>

            <form.Field name="apiUrl">
              {#snippet children(field)}
                <TextField
                    name={field.name}
                    type="text"
                    label="Frame URL"
                    placeholder="Enter the url of the frame..."
                    value={field.state.value}
                    handleBlur={field.handleBlur}
                    handleChange={field.handleChange}
                    errors={field.state.meta.errors}
                />
              {/snippet}
            </form.Field>
        </div>
        <Button type="submit" class="w-full">Create</Button>
    </div>
  </form>
</div>
