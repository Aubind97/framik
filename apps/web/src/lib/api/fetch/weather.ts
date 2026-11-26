import type { FetchQueryOptions } from "@tanstack/svelte-query";
import type { WeatherConfig } from "#lib/weather.ts";
import { getErrorMessage, getFetcher } from "./index.ts";

export function getWeatherLocationsQueryOptions(params: { q: string }, fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["weather", "locations", params.q],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/weather/locations", { method: "GET", query: params });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
	} satisfies FetchQueryOptions;
}

export function getWeatherPreviewQueryOptions(config: WeatherConfig, fetch?: typeof globalThis.fetch) {
	return {
		queryKey: ["weather", "preview", config],
		queryFn: async () => {
			const { data, error } = await getFetcher(fetch)("/api/weather/preview", { method: "GET", query: config });
			if (error) throw new Error(getErrorMessage(error));
			return data;
		},
	} satisfies FetchQueryOptions;
}
