<script lang="ts" generics="TData, TValue">
import { type ColumnDef, getCoreRowModel, getSortedRowModel, type SortingState } from "@tanstack/table-core";
import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table";
import * as Table from "$lib/components/ui/table";

type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
};

let { data, columns }: DataTableProps<TData, TValue> = $props();

let sorting = $state<SortingState>([]);

const table = createSvelteTable({
	get data() {
		return data;
	},
	columns,
	getCoreRowModel: getCoreRowModel(),
	getSortedRowModel: getSortedRowModel(),
	onSortingChange: (updater) => {
		if (typeof updater === "function") {
			sorting = updater(sorting);
		} else {
			sorting = updater;
		}
	},
	state: {
		get sorting() {
			return sorting;
		},
	},
});
</script>

<div class="rounded-md border">
  <Table.Root>
    <Table.Header>
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head colspan={header.colSpan}>
              {#if !header.isPlaceholder}
                <FlexRender
                  content={header.column.columnDef.header}
                  context={header.getContext()}
                />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#each table.getRowModel().rows as row (row.id)}
        <Table.Row data-state={row.getIsSelected() && "selected"}>
          {#each row.getVisibleCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender
                content={cell.column.columnDef.cell}
                context={cell.getContext()}
              />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length} class="h-24 text-center">
            No results.
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
