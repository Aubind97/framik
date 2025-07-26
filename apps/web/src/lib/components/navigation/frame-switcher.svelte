<script lang="ts">
import { TvMinimal } from "@lucide/svelte";
import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
import PlusIcon from "@lucide/svelte/icons/plus";
import { useActiveOrganization, useListOrganizations } from "$lib/auth-client";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.ts";
import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
import { useSidebar } from "$lib/components/ui/sidebar/index.ts";

const sidebar = useSidebar();

const organizations = useListOrganizations();
const activeOrganization = useActiveOrganization();
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            {...props}
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div
              class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
            >
                <TvMinimal class="h-4 w-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {$activeOrganization?.data?.name}
              </span>
              <span class="truncate text-xs">TODO: ADD DOMAIN HERE</span>
            </div>
            <ChevronsUpDownIcon class="ml-auto" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        align="start"
        side={sidebar.isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenu.Label class="text-muted-foreground text-xs">Frames</DropdownMenu.Label>
        {#each ($organizations?.data ?? []) as organization, index (organization.id)}
          <DropdownMenu.Item onSelect={() => {
            console.log('TODO: implement organization switch')
          }} class="gap-2 p-2">
            <div class="flex size-6 items-center justify-center rounded-md border">
              <TvMinimal />
            </div>
            {organization.name}
          </DropdownMenu.Item>
        {/each}
        <DropdownMenu.Separator />
        <DropdownMenu.Item class="gap-2 p-2">
          <div
            class="flex size-6 items-center justify-center rounded-md border bg-transparent"
          >
            <PlusIcon class="size-4" />
          </div>
          <div class="text-muted-foreground font-medium">Add Frame</div>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
