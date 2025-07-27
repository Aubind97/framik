import type { FetchQueryOptions } from "@tanstack/svelte-query";
import { fetch } from "./index.ts";

export function getDaemonFrameStatusQueryOptions(params: { daemonUrl: string }) {
	return {
		queryKey: ["daemon", params.daemonUrl],
		queryFn: async () => fetch("/api/daemon/status", { method: "GET", query: { daemonUrl: params.daemonUrl } }),
	} satisfies FetchQueryOptions;
}
