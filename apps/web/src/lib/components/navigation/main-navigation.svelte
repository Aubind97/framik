<script lang="ts">
import { Images, Settings2 } from "@lucide/svelte";
import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
import * as Collapsible from "$lib/components/ui/collapsible/index.ts";
import * as Sidebar from "$lib/components/ui/sidebar/index.ts";

const items = [
	{
		title: "Widgets",
		isActive: false,
		icon: Images,
		url: "#",
	},
	{
		title: "Settings",
		isActive: false,
		icon: Settings2,
		items: [
			{
				title: "Frames",
				url: "#",
			},
			{
				title: "Account",
				url: "#",
			},
		],
	},
] as const;
</script>

<Sidebar.Group>
  <Sidebar.GroupLabel>Features</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each items as item (item.title)}
      <Collapsible.Root open={item.isActive} class="group/collapsible">
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
              {#if 'items' in item}
            <Collapsible.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuButton {...props} tooltipContent={item.title}>
                  {#if item.icon}
                    <item.icon />
                  {/if}
                  <span>{item.title}</span>
                  <ChevronRightIcon
                    class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  />
                </Sidebar.MenuButton>
              {/snippet}
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Sidebar.MenuSub>
                {#each item.items ?? [] as subItem (subItem.title)}
                  <Sidebar.MenuSubItem>
                    <Sidebar.MenuSubButton>
                      {#snippet child({ props })}
                        <a href={subItem.url} {...props}>
                          <span>{subItem.title}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                {/each}
              </Sidebar.MenuSub>
            </Collapsible.Content>
            {:else}
            <Sidebar.MenuButton {...props} tooltipContent={item.title}>
              {#if item.icon}
                <item.icon />
              {/if}
              <span>{item.title}</span>
            </Sidebar.MenuButton>
            {/if}
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
