<script lang="ts">
import { ImageIcon } from "@lucide/svelte";
import type { ComponentProps } from "svelte";
import * as Sidebar from "$lib/components/ui/sidebar/index.js";

let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
          {#snippet child({ props })}
            <a href="##" {...props}>
              <ImageIcon />
              <span class="text-base font-semibold">Framik</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    Main
  </Sidebar.Content>
  <Sidebar.Footer>
    Footer
  </Sidebar.Footer>
</Sidebar.Root>
