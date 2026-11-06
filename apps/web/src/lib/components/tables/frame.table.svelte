<script lang="ts">
import { type ColumnDef, renderComponent } from "@tanstack/svelte-table";
import { createRawSnippet } from "svelte";
import Badge from "#lib/components/ui/badge/badge.svelte";
import type { Frame } from "#lib/server/db/types.ts";
import Pulse from "../utils/pulse.svelte";
import SortableHeader from "./sortable-header.svelte";
import Table, { features } from "./table.svelte";

let { frames = [], framesStatus }: { frames?: Frame[]; framesStatus: Record<string, { online: boolean; version?: string }> } = $props();

const columns: ColumnDef<typeof features, Frame>[] = $derived([
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
		header: ({ column }) =>
			renderComponent(SortableHeader, {
				name: "Version",
				onclick: column.getToggleSortingHandler(),
			}),
		cell: ({ cell }) => {
			const version = framesStatus[cell.row.original.id]?.version;
			return renderComponent(Badge, { variant: "secondary", children: createRawSnippet(() => ({ render: () => `<span>${version ?? "-"}</span>` })) });
		},
	},
	{
		accessorKey: "id",
		id: "status",
		header: ({ column }) =>
			renderComponent(SortableHeader, {
				name: "Status",
				onclick: column.getToggleSortingHandler(),
			}),
		cell: ({ cell }) => renderComponent(Pulse, { enabled: framesStatus[cell.row.original.id]?.online }),
	},
]);
</script>

<Table data={frames} {columns} />
