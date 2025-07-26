<script lang="ts">
import type { ComponentProps } from "svelte";
import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
import type { AuthUser } from "$lib/server/db/types";
import MainNavigation from "./main-navigation.svelte";
import OrganizationSwitcher from "./organization-switcher.svelte";
import UserSwitcher from "./user-switcher.svelte";

let { user, ...restProps }: ComponentProps<typeof Sidebar.Root> & { user: AuthUser } = $props();
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
  <Sidebar.Header>
    <OrganizationSwitcher/>
  </Sidebar.Header>
  <Sidebar.Content>
    <MainNavigation />
  </Sidebar.Content>
  <Sidebar.Footer>
    <UserSwitcher {user} />
  </Sidebar.Footer>
</Sidebar.Root>
