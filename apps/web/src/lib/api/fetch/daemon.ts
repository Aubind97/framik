import type { FetchQueryOptions } from "@tanstack/svelte-query";
import { getFetcher } from "./index.ts";

export function getDaemonFrameStatusQueryOptions(params: { daemonUrl: string }, fetch?:  typeof globalThis.fetch) {
	return {
		queryKey: ["daemon", params.daemonUrl],
		queryFn: async () => getFetcher(fetch)("/api/daemon/status", { method: "GET", query: { daemonUrl: params.daemonUrl } }),
	} satisfies FetchQueryOptions;
}

export function pushDaemonFrame(body: { daemonUrl: string; image: string }, fetch?:  typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/daemon/frame/push", { method: "POST", body });
}

export function clearDaemonFrame(body: { daemonUrl: string }, fetch?:  typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/daemon/frame/clear", { method: "POST", body });
}
