<script lang="ts">
import { getInitials } from "@framik/shared/browser";
import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
import PlusIcon from "@lucide/svelte/icons/plus";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.ts";
import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
import { useSidebar } from "$lib/components/ui/sidebar/index.ts";

const sidebar = useSidebar();

// TODO fetch frames from the database
const frames = [{ name: "Desk frame", domain: "frame.local" }];

// TODO fetch frame form the database
let activeFrame = $state(frames[0]);
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
                {getInitials(activeFrame.name)}
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {activeFrame.name}
              </span>
              <span class="truncate text-xs">{activeFrame.domain}</span>
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
        {#each frames as frame, index (frame.name)}
          <DropdownMenu.Item onSelect={() => (activeFrame = frame)} class="gap-2 p-2">
            <div class="flex size-6 items-center justify-center rounded-md border">
              {getInitials(frame.name)}
            </div>
            {frame.name}
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
