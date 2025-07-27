import type { FetchQueryOptions } from "@tanstack/svelte-query";
import { fetch } from "./index.ts";

export function getDaemonFrameStatusQueryOptions(params: { daemonUrl: string }) {
	return {
		queryKey: ["daemon", params.daemonUrl],
		queryFn: async () => fetch("/api/daemon/status", { method: "GET", query: { daemonUrl: params.daemonUrl } }),
	} satisfies FetchQueryOptions;
}

export function pushDaemonFrame(body: { daemonUrl: string }) {
	return fetch("/api/daemon/frame/push", { method: "POST", body });
}

export function clearDaemonFrame(body: { daemonUrl: string }) {
	return fetch("/api/daemon/frame/clear", { method: "POST", body });
}
