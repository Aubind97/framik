<script lang="ts">
import { createForm } from "@tanstack/svelte-form";
import type { HTMLAttributes } from "svelte/elements";
import { Button } from "$lib/components/ui/button/index.ts";
import { cn, type WithElementRef } from "$lib/utils.ts";
import { type SignUpFormValue, signUpSchema } from "./utils/schemas";
import TextField from "./utils/text-field.svelte";

let {
	ref = $bindable(null),
	class: className,
	handleSubmit,
	...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { handleSubmit?: (formValue: SignUpFormValue) => Promise<void> } = $props();
const id = $props.id();

const DEFAULT_VALUES = {
	email: "",
	password: "",
	name: "",
};

const form = createForm(() => ({
	defaultValues: DEFAULT_VALUES,
	validators: { onSubmit: signUpSchema },
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
      <div class="flex flex-col items-center gap-2">
        <a href="/" class="flex flex-col items-center gap-2 font-medium">
            <img alt="Framik logo" src={"logo.svg"} class="size-12" />
            <span class="sr-only">Framik</span>
        </a>
        <h1 class="text-xl font-bold">Welcome to Framik</h1>
        <div class="text-center text-sm">
            Already have an account?
          <a href="/sign-in" class="underline underline-offset-4"> Sign in </a>
        </div>
      </div>
      <div class="flex flex-col gap-6">
        <div class="grid gap-3">
            <form.Field name="name">
              {#snippet children(field)}
                  <TextField
                      name={field.name}
                      type="text"
                      label="Name"
                      placeholder="Enter a name..."
                      value={field.state.value}
                      handleBlur={field.handleBlur}
                      handleChange={field.handleChange}
                      errors={field.state.meta.errors}
                  />
              {/snippet}
            </form.Field>

            <form.Field name="email">
              {#snippet children(field)}
                <TextField
                    name={field.name}
                    type="email"
                    label="Email"
                    placeholder="Enter an email..."
                    value={field.state.value}
                    handleBlur={field.handleBlur}
                    handleChange={field.handleChange}
                    errors={field.state.meta.errors}
                />
              {/snippet}
            </form.Field>

            <form.Field name="password">
              {#snippet children(field)}
                <TextField
                    name={field.name}
                    type="password"
                    label="Password"
                    placeholder="Enter a password..."
                    value={field.state.value}
                    handleBlur={field.handleBlur}
                    handleChange={field.handleChange}
                    errors={field.state.meta.errors}
                />
              {/snippet}
            </form.Field>
        </div>
        <Button type="submit" class="w-full" disabled={!form.state.isValid || form.state.isSubmitting} onclick={() => {form.handleSubmit()}}>Sign Up</Button>
      </div>
    </div>
  </form>
</div>
