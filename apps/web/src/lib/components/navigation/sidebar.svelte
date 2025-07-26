<script lang="ts">
import type { ComponentProps } from "svelte";
import * as Sidebar from "$lib/components/ui/sidebar/index.js";
import FrameSwitcher from "./frame-switcher.svelte";
import MainNavigation from "./main-navigation.svelte";
import UserSwitcher from "./user-switcher.svelte";

let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
  <Sidebar.Header>
    <FrameSwitcher />
  </Sidebar.Header>
  <Sidebar.Content>
    <MainNavigation />
  </Sidebar.Content>
  <Sidebar.Footer>
    <UserSwitcher />
  </Sidebar.Footer>
</Sidebar.Root>
