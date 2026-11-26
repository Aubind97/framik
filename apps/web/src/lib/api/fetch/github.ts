import type { FetchQueryOptions } from "@tanstack/svelte-query";
import type { GithubConfig } from "#lib/github.ts";
import { getErrorMessage, getFetcher } from "./index.ts";

export function getGithubPreviewQueryOptions(config: GithubConfig, fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["github", "preview", config],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/github/preview", { method: "POST", body: config });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
	} satisfies FetchQueryOptions;
}

export function getGithubIntegrationQueryOptions(fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["github", "integration"],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/github/integration", { method: "GET" });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
	} satisfies FetchQueryOptions;
}

export function saveGithubIntegration(body: { token: string }, fetch?: typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/github/integration", { method: "POST", body });
}

export function deleteGithubIntegration(fetch?: typeof globalThis.fetch) {
	return getFetcher(fetch)("/api/github/integration", { method: "DELETE" });
}
