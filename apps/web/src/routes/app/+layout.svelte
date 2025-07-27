<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { useSession } from "$lib/auth-client";
import HeaderNavigation from "$lib/components/navigation/header-navigation.svelte";
import Sidebar from "$lib/components/navigation/sidebar.svelte";
import SidebarInset from "$lib/components/ui/sidebar/sidebar-inset.svelte";
import SidebarProvider from "$lib/components/ui/sidebar/sidebar-provider.svelte";
import type { LayoutProps } from "./$types";

const { children, data }: LayoutProps = $props();

// Get client-side session for reactive updates
// Monitor session changes and redirect if session becomes invalid
const session = useSession();
onMount(() => {
	const unsubscribe = session.subscribe((sessionData) => {
		if (!sessionData && typeof window !== "undefined") {
			goto("/sign-in");
		}
	});

	return unsubscribe;
});
</script>

<SidebarProvider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
    <Sidebar variant="sidebar" user={data.user} />
    <SidebarInset>
        <HeaderNavigation />
        <div class="flex flex-1 flex-col">
            <div class="@container/main flex flex-1 flex-col gap-2 p-4 lg:p-8">
                {@render children()}
            </div>
        </div>
    </SidebarInset>
</SidebarProvider>
