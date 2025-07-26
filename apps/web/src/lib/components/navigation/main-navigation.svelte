<script lang="ts">
import { GalleryVerticalEnd, LayoutDashboard, Settings2, TvMinimal } from "@lucide/svelte";
import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
import { goto } from "$app/navigation";
import * as Collapsible from "$lib/components/ui/collapsible/index.ts";
import * as Sidebar from "$lib/components/ui/sidebar/index.ts";

const items = [
	{
		title: "Home",
		isActive: false,
		icon: LayoutDashboard,
		url: "/app",
	},
	{
		title: "Widgets Library",
		isActive: false,
		icon: GalleryVerticalEnd,
		url: "/app/widgets",
	},
	{
		title: "Frames",
		isActive: false,
		icon: TvMinimal,
		url: "/app/frames",
	},
	{
		title: "Settings",
		isActive: false,
		icon: Settings2,
		items: [
			{
				title: "Organization",
				url: "/app/organizations/settings",
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
                <a href={item.url}>
                    <Sidebar.MenuButton {...props} tooltipContent={item.title} class="cursor-pointer">
                        {#if item.icon}
                            <item.icon />
                        {/if}
                        <span>{item.title}</span>
                    </Sidebar.MenuButton>
                </a>
            {/if}
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
