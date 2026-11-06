import { QueryClient } from "@tanstack/svelte-query";
import { browser } from "$app/env";

export async function load() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
			},
		},
	});

	return { queryClient };
}
