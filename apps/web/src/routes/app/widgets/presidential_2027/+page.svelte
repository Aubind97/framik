<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { mode as theme } from "mode-watcher";
import { getFrameScheduleQueryOptions } from "#lib/api/fetch/frame.ts";
import { getPresidentialPreviewQueryOptions } from "#lib/api/fetch/presidential.ts";
import Label from "#lib/components/ui/label/label.svelte";
import * as Select from "#lib/components/ui/select/index.ts";
import FrameControls from "#lib/components/utils/frame-controls.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import { WIDGETS } from "#lib/constants.ts";
import { PRESIDENTIAL_MODES, type PresidentialConfig } from "#lib/presidential.ts";
import type { Frame } from "#lib/server/db/types.ts";

const WIDGET = WIDGETS.presidential_2027;
const WIKIPEDIA_URL = "https://fr.wikipedia.org/wiki/Liste_de_sondages_sur_l%27%C3%A9lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027";

const id = $props.id();

let mode = $state<PresidentialConfig["mode"]>("ranking");
let selectedFrame = $state<Frame | undefined>(undefined);

const previewQuery = createQuery(() => ({ ...getPresidentialPreviewQueryOptions({ mode }), retry: false }));
const scheduleQuery = createQuery(() => ({
	...getFrameScheduleQueryOptions({ frameId: selectedFrame?.id ?? "" }),
	enabled: !!selectedFrame,
}));

// The schedule row does not tie its config type to its widget
const schedule = $derived(scheduleQuery.data?.widget === "presidential_2027" ? { ...scheduleQuery.data, config: scheduleQuery.data.config as PresidentialConfig } : undefined);
const scheduledMode = $derived(schedule?.config.mode);

$effect(() => {
	if (scheduledMode) mode = scheduledMode;
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

        <FrameControls schedule={previewQuery.data ? { widget: "presidential_2027", config: { mode } } : undefined} onSelectedFrame={(frame) => (selectedFrame = frame)} />
    </div>
    <div class="flex-1 flex items-start lg:items-center justify-center">
        <div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
            <Widget
                image={previewQuery.data}
                showProcessedPreview={false}
                emptyLabel={previewQuery.isError ? previewQuery.error.message : "Loading the latest polls…"}
            />

            <aside class="p-4 border rounded min-w-64 lg:w-72 flex flex-col gap-4 text-sm">
                <h1 class="font-bold text-base">Settings</h1>

                <div class="flex flex-col gap-2">
                    <Label for="{id}-mode">Mode</Label>
                    <Select.Root type="single" bind:value={mode}>
                        <Select.Trigger id="{id}-mode" class="w-full">{PRESIDENTIAL_MODES[mode].label}</Select.Trigger>
                        <Select.Content>
                            {#each Object.entries(PRESIDENTIAL_MODES) as [value, option] (value)}
                                <Select.Item {value} label={option.label}>{option.label}</Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                    <p class="text-muted-foreground">{PRESIDENTIAL_MODES[mode].description}</p>
                </div>

                <p class="text-muted-foreground">
                    Scores are the first-round average of the polls published in the 30 days before the latest one. Each poll counts once, whatever the number of hypotheses it tests.
                </p>
                <p class="text-muted-foreground">Ranking arrows compare with the 30 days before. Trend curves weight each poll by its distance in time. The frame refreshes daily.</p>
                <a class="underline" href={WIKIPEDIA_URL} target="_blank" rel="noreferrer">Source: Wikipedia</a>

                {#if schedule}
                    <p class="text-muted-foreground">
                        This frame shows the poll {PRESIDENTIAL_MODES[schedule.config.mode].label.toLowerCase()}, refreshed daily
                        {#if schedule.lastPushedAt}(last pushed {new Date(schedule.lastPushedAt).toLocaleString()}){/if}
                    </p>
                {/if}
            </aside>
        </div>
    </div>
</div>
