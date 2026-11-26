import type { FetchQueryOptions } from "@tanstack/svelte-query";
import type { PresidentialConfig } from "#lib/presidential.ts";
import { getErrorMessage, getFetcher } from "./index.ts";

export function getPresidentialPreviewQueryOptions(config: PresidentialConfig, fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["presidential_2027", "preview", config.mode],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/presidential/preview", { method: "GET", query: config });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
	} satisfies FetchQueryOptions;
}
