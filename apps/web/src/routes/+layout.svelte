<script lang="ts">
import { QueryClientProvider } from "@tanstack/svelte-query";
import type { LayoutProps } from "./$types";
import "../app.css";
import { Toaster } from "$lib/components/ui/sonner/index.js";

let { children, data }: LayoutProps = $props();
</script>

<QueryClientProvider client={data.queryClient}>
    <Toaster richColors closeButton />
    {@render children?.()}
</QueryClientProvider>
