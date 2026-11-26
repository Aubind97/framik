<script lang="ts">
import { MapPin } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { mode as theme } from "mode-watcher";
import { getFrameScheduleQueryOptions } from "#lib/api/fetch/frame.ts";
import { getWeatherLocationsQueryOptions, getWeatherPreviewQueryOptions } from "#lib/api/fetch/weather.ts";
import { Input } from "#lib/components/ui/input/index.ts";
import Label from "#lib/components/ui/label/label.svelte";
import * as Select from "#lib/components/ui/select/index.ts";
import FrameControls from "#lib/components/utils/frame-controls.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import { WIDGETS } from "#lib/constants.ts";
import type { Frame } from "#lib/server/db/types.ts";
import { TEMPERATURE_UNITS, WEATHER_FORECASTS, type WeatherConfig, type WeatherLocation } from "#lib/weather.ts";

const WIDGET = WIDGETS.weather;
const id = $props.id();

let location = $state<WeatherLocation | undefined>(undefined);
let unit = $state<WeatherConfig["unit"]>("celsius");
let forecast = $state<WeatherConfig["forecast"]>("hours");
let search = $state("");
let submittedSearch = $state("");
let selectedFrame = $state<Frame | undefined>(undefined);

const config = $derived<WeatherConfig | undefined>(location && { ...location, unit, forecast });
const locationsQuery = createQuery(() => ({
	...getWeatherLocationsQueryOptions({ q: submittedSearch }),
	enabled: submittedSearch.length >= 2,
	// Keeps the last suggestions on screen while the next ones load
	placeholderData: (previous) => previous,
}));
const previewQuery = createQuery(() => ({
	// biome-ignore lint/style/noNonNullAssertion: can't be null since the query will be disabled
	...getWeatherPreviewQueryOptions(config!),
	enabled: !!config,
	retry: false,
}));
const scheduleQuery = createQuery(() => ({
	...getFrameScheduleQueryOptions({ frameId: selectedFrame?.id ?? "" }),
	enabled: !!selectedFrame,
}));

// The schedule row does not tie its config type to its widget
const schedule = $derived(scheduleQuery.data?.widget === "weather" ? { ...scheduleQuery.data, config: scheduleQuery.data.config as WeatherConfig } : undefined);
// Serialised so a background refetch of the same schedule does not reset the fields
const scheduledConfig = $derived(schedule && JSON.stringify(schedule.config));
const preview = $derived(!config || previewQuery.isError ? null : previewQuery.data);

const describe = (place: WeatherLocation) => [place.region, place.country].filter(Boolean).join(", ");

function pickLocation(place: WeatherLocation) {
	location = place;
	search = "";
	submittedSearch = "";
}

$effect(() => {
	const next = search.trim();
	const timer = setTimeout(() => (submittedSearch = next), 300);
	return () => clearTimeout(timer);
});

$effect(() => {
	if (!scheduledConfig) return;
	const { unit: scheduledUnit, forecast: scheduledForecast, ...place }: WeatherConfig = JSON.parse(scheduledConfig);
	location = place;
	unit = scheduledUnit;
	forecast = scheduledForecast;
});
</script>

<svelte:head>
    <title>{WIDGET.name} · Framik</title>
</svelte:head>

<div class="h-full flex flex-col gap-4">
    <div class="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div class="flex items-center gap-4">
            <img alt="{WIDGET.name} Logo" src={theme.current === 'dark'? WIDGET.logoDark : WIDGET.logoLight} class="size-8"/>
            <div>
                <h1 class="text-xl font-bold">{WIDGET.name}</h1>
                <p class="text-muted-foreground">{WIDGET.description}</p>
            </div>
        </div>

        <FrameControls schedule={preview && config ? { widget: "weather", config } : undefined} onSelectedFrame={(frame) => (selectedFrame = frame)} />
    </div>
    <div class="flex-1 flex items-start lg:items-center justify-center">
        <div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
            <!-- Not stretched to a taller settings panel, so the frame keeps its aspect ratio -->
            <div class="min-w-0 self-start">
                <Widget
                    image={preview}
                    showProcessedPreview={false}
                    emptyLabel={previewQuery.isError ? previewQuery.error.message : config ? "Loading the forecast…" : "Search for a location to load a preview"}
                />
            </div>

            <aside class="p-4 border rounded min-w-64 lg:w-72 flex flex-col gap-4 text-sm">
                <h1 class="font-bold text-base">Settings</h1>

                <div class="flex flex-col gap-2">
                    <Label for="{id}-search">Location</Label>
                    {#if location}
                        <p class="flex items-center gap-2">
                            <MapPin class="size-4 shrink-0" />
                            <span><span class="font-medium">{location.name}</span> <span class="text-muted-foreground">{describe(location)}</span></span>
                        </p>
                    {/if}
                    <div class="relative">
                        <Input id="{id}-search" type="search" bind:value={search} placeholder={location ? "Change location" : "Type a city name"} autocomplete="off" />
                        {#if submittedSearch.length >= 2 && locationsQuery.data?.length}
                            <ul class="absolute top-full mt-1 z-10 w-full max-h-80 overflow-y-auto flex flex-col rounded-md border bg-popover text-popover-foreground shadow-md">
                                {#each locationsQuery.data as place (`${place.latitude},${place.longitude}`)}
                                    <li>
                                        <button type="button" class="w-full text-left px-3 py-2 hover:bg-muted" onclick={() => pickLocation(place)}>
                                            <span class="font-medium">{place.name}</span>
                                            <span class="block text-xs text-muted-foreground">{describe(place)}</span>
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    {#if submittedSearch.length >= 2 && locationsQuery.isError}
                        <p class="text-destructive">{locationsQuery.error.message}</p>
                    {:else if submittedSearch.length >= 2 && locationsQuery.data?.length === 0}
                        <p class="text-muted-foreground">No location found for "{submittedSearch}".</p>
                    {/if}
                </div>

                <div class="flex flex-col gap-2">
                    <Label for="{id}-unit">Unit</Label>
                    <Select.Root type="single" bind:value={unit}>
                        <Select.Trigger id="{id}-unit" class="w-full">{TEMPERATURE_UNITS[unit].label}</Select.Trigger>
                        <Select.Content>
                            {#each Object.entries(TEMPERATURE_UNITS) as [value, option] (value)}
                                <Select.Item {value} label={option.label}>{option.label}</Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>

                <div class="flex flex-col gap-2">
                    <Label for="{id}-forecast">Forecast</Label>
                    <Select.Root type="single" bind:value={forecast}>
                        <Select.Trigger id="{id}-forecast" class="w-full">{WEATHER_FORECASTS[forecast].label}</Select.Trigger>
                        <Select.Content>
                            {#each Object.entries(WEATHER_FORECASTS) as [value, option] (value)}
                                <Select.Item {value} label={option.label}>{option.label}</Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                    <p class="text-muted-foreground">{WEATHER_FORECASTS[forecast].description}</p>
                </div>

                <a class="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo.com</a>

                {#if schedule}
                    <p class="text-muted-foreground">
                        This frame shows the weather in {schedule.config.name}, refreshed hourly
                        {#if schedule.lastPushedAt}(last pushed {new Date(schedule.lastPushedAt).toLocaleString()}){/if}
                    </p>
                {/if}
            </aside>
        </div>
    </div>
</div>
