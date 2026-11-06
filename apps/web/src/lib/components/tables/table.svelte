<script lang="ts" module>
import { createSortedRowModel, rowSortingFeature, sortFns, tableFeatures } from "@tanstack/svelte-table";

export const features = tableFeatures({
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	sortFns,
});
</script>

<script lang="ts" generics="TData extends RowData">
import { type ColumnDef, createTable, FlexRender, type RowData } from "@tanstack/svelte-table";
import * as Table from "#lib/components/ui/table/index.ts";

type DataTableProps<TData extends RowData> = {
	columns: ColumnDef<typeof features, TData>[];
	data: TData[];
};

let { data, columns }: DataTableProps<TData> = $props();

const table = createTable({
	features,
	get data() {
		return data;
	},
	get columns() {
		return columns;
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
                <FlexRender {header} />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#each table.getRowModel().rows as row (row.id)}
        <Table.Row>
          {#each row.getAllCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender {cell} />
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
