<script lang="ts">
import { QueryClientProvider } from "@tanstack/svelte-query";
import type { LayoutProps } from "./$types";
import "../app.css";
import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
import { Toaster } from "$lib/components/ui/sonner/index.js";
import { ModeWatcher } from "mode-watcher";

let { children, data }: LayoutProps = $props();
</script>

<QueryClientProvider client={data.queryClient}>
    <ModeWatcher />
    <Toaster richColors closeButton />
    {@render children?.()}
    <SvelteQueryDevtools />
</QueryClientProvider>
