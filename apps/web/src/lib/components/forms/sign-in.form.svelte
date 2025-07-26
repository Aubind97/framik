<script lang="ts">
import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
import { createForm } from "@tanstack/svelte-form";
import type { HTMLAttributes } from "svelte/elements";
import { Button } from "$lib/components/ui/button/index.ts";
import { cn, type WithElementRef } from "$lib/utils.ts";
import { type SignInFormValue, signInSchema } from "./utils/schemas";
import TextField from "./utils/text-field.svelte";

let {
	ref = $bindable(null),
	class: className,
	handleSubmit,
	...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { handleSubmit?: (formValue: SignInFormValue) => Promise<void> } = $props();
const id = $props.id();

const DEFAULT_VALUES = {
	email: "",
	password: "",
};

const form = createForm(() => ({
	defaultValues: DEFAULT_VALUES,
	validators: { onSubmit: signInSchema },
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
        <a href="##" class="flex flex-col items-center gap-2 font-medium">
          <div class="flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEndIcon class="size-6" />
          </div>
          <span class="sr-only">Framik</span>
        </a>
        <h1 class="text-xl font-bold">Welcome to Framik</h1>
        <div class="text-center text-sm">
          Don't have an account?
          <a href="/sign-up" class="underline underline-offset-4"> Sign up </a>
        </div>
      </div>
      <div class="flex flex-col gap-6">
        <div class="grid gap-3">
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
        <Button type="submit" class="w-full">Login</Button>
      </div>
    </div>
  </form>
</div>
