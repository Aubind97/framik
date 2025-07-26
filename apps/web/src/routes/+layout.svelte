<script lang="ts">
import HeaderNavigation from "$lib/components/navigation/header-navigation.svelte";
import Sidebar from "$lib/components/navigation/sidebar.svelte";
import SidebarInset from "$lib/components/ui/sidebar/sidebar-inset.svelte";
import SidebarProvider from "$lib/components/ui/sidebar/sidebar-provider.svelte";
import "../app.css";

const { children } = $props();
</script>

<SidebarProvider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
    <Sidebar variant="sidebar" />
    <SidebarInset>
        <HeaderNavigation />
        <div class="flex flex-1 flex-col">
            <div class="@container/main flex flex-1 flex-col gap-2 p-8">
                {@render children()}
            </div>
        </div>
    </SidebarInset>
</SidebarProvider>
