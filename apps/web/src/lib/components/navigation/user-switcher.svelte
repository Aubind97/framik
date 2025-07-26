<script lang="ts">
import { getInitials } from "@framik/shared/browser";
import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
import LogOutIcon from "@lucide/svelte/icons/log-out";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { signOut } from "$lib/auth-client";
import * as Avatar from "$lib/components/ui/avatar/index.ts";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.ts";
import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
import { useSidebar } from "$lib/components/ui/sidebar/index.ts";

// TODO: get from db
const user = { name: "Joe Doe", email: "joe@doe.fr" };

const sidebar = useSidebar();

async function handleLogout() {
	const { error } = await signOut();

	if (error?.code) {
		toast.error(error.code);
	}

	goto("/sign-in");
}
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            {...props}
          >
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Fallback class="rounded-lg">{getInitials(user.name)}</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Fallback class="rounded-lg">{getInitials(user.name)}</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={handleLogout}>
          <LogOutIcon />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
