<script lang="ts">
import { type ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import Badge from "$lib/components/ui/badge/badge.svelte";
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
		id: "version",
		header: "Version",
		cell: ({ cell }) => renderComponent(Badge, { variant: "secondary", children: createRawSnippet(() => ({ render: () => framesStatus[cell.row.original.id]?.version ?? "-" })) }),
	},
	{
		accessorKey: "id",
		id: "status",
		header: "Status",
		cell: ({ cell }) => renderComponent(Pulse, { enabled: framesStatus[cell.row.original.id]?.online }),
	},
];

// TODO: Request the status of each frames
let { frames = [], framesStatus }: { frames?: Frame[]; framesStatus: Record<string, { online: boolean; version?: string }> } = $props();
</script>

<Table data={frames} {columns} />
