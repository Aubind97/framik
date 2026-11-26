import type { FetchQueryOptions } from "@tanstack/svelte-query";
import { getErrorMessage, getFetcher } from "./index.ts";

export function getGithubPreviewQueryOptions(params: { username: string }, fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["github", params.username, "preview"],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/github/preview", { method: "GET", query: params });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
	} satisfies FetchQueryOptions;
}
