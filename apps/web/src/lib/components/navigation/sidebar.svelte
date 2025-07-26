<script lang="ts">
import type { ComponentProps } from "svelte";
import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
import type { AuthSession, AuthUser } from "$lib/server/db/types";
import FrameSwitcher from "./frame-switcher.svelte";
import MainNavigation from "./main-navigation.svelte";
import UserSwitcher from "./user-switcher.svelte";

let { user, session, ...restProps }: ComponentProps<typeof Sidebar.Root> & { user: AuthUser; session: AuthSession } = $props();
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
  <Sidebar.Header>
    <FrameSwitcher activeOrganizationId={session.activeOrganizationId}/>
  </Sidebar.Header>
  <Sidebar.Content>
    <MainNavigation />
  </Sidebar.Content>
  <Sidebar.Footer>
    <UserSwitcher {user} />
  </Sidebar.Footer>
</Sidebar.Root>
