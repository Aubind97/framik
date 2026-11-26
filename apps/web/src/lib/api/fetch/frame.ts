import type { FetchQueryOptions } from "@tanstack/svelte-query";
import { getErrorMessage, getFetcher } from "./index.ts";

export function getAllFramesQueryOptions(params: { organizationId: string }, fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["frames", params.organizationId],
		queryFn: async () => getFetcher(fetch)("/api/frames", { method: "GET", query: { organizationId: params.organizationId } }),
	} satisfies FetchQueryOptions;
}

export function createFrame(body: { organizationId: string; name: string; apiUrl: string }, fetch?: typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/frames", { method: "POST", body });
}

export function deleteFrame(id: string, fetch?: typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/frames/:id", { method: "DELETE", params: { id } });
}

export function getFrameScheduleQueryOptions(params: { frameId: string }, fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["frames", params.frameId, "schedule"],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/frames/:id/schedule", { method: "GET", params: { id: params.frameId } });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
	} satisfies FetchQueryOptions;
}

export function scheduleFrame(frameId: string, body: { widget: "github"; config: { username: string } }, fetch?: typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/frames/:id/schedule", { method: "POST", params: { id: frameId }, body });
}
