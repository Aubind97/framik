<script lang="ts">
import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
import type { HTMLAttributes } from "svelte/elements";
import { Button } from "$lib/components/ui/button/index.ts";
import { Input } from "$lib/components/ui/input/index.ts";
import { Label } from "$lib/components/ui/label/index.ts";
import { cn, type WithElementRef } from "$lib/utils.ts";

let { ref = $bindable(null), class: className, ...restProps }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
const id = $props.id();
</script>

<div class={cn("flex flex-col gap-6", className)} bind:this={ref} {...restProps}>
  <form>
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
            Already have an account?
          <a href="/sign-in" class="underline underline-offset-4"> Sign in </a>
        </div>
      </div>
      <div class="flex flex-col gap-6">
        <div class="grid gap-3">
          <Label for="name-{id}">Username</Label>
          <Input id="name-{id}" type="email" placeholder="Joe" required />

          <Label for="email-{id}">Email</Label>
          <Input id="email-{id}" type="email" placeholder="joe@doe.com" required />

          <Label for="password-{id}">Password</Label>
          <Input id="password-{id}" type="password" placeholder="********" required />
        </div>
        <Button type="submit" class="w-full">Sign Up</Button>
      </div>
    </div>
  </form>
</div>
