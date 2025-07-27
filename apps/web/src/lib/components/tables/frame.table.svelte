<script lang="ts">
import { type ColumnDef } from "@tanstack/table-core";
import { renderComponent } from "$lib/components/ui/data-table";
import type { Frame } from "$lib/server/db/types";
import Pulse from "../utils/pulse.svelte";
import SortableHeader from "./sortable-header.svelte";
import Table from "./table.svelte";

const columns: ColumnDef<Frame>[] = [
	{
		accessorKey: "name",
		header: ({ column }) =>
			renderComponent(SortableHeader, {
				name: "Name",
				onclick: column.getToggleSortingHandler(),
			}),
	},
	{
		accessorKey: "apiUrl",
		header: ({ column }) =>
			renderComponent(SortableHeader, {
				name: "API URL",
				onclick: column.getToggleSortingHandler(),
			}),
	},
	{
		accessorKey: "id",
		header: "Status",
		cell: () => {
			return renderComponent(Pulse);
		},
	},
];

// TODO: Request the status of each frames
let { frames = [] }: { frames?: Frame[] } = $props();
</script>

<Table data={frames} {columns} />
