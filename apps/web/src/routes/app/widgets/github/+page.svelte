<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { mode } from "mode-watcher";
import { getFrameScheduleQueryOptions } from "#lib/api/fetch/frame.ts";
import { getGithubPreviewQueryOptions } from "#lib/api/fetch/github.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import { Input } from "#lib/components/ui/input/index.ts";
import Label from "#lib/components/ui/label/label.svelte";
import FrameControls from "#lib/components/utils/frame-controls.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import { WIDGETS } from "#lib/constants.ts";
import type { Frame } from "#lib/server/db/types.ts";

const WIDGET = WIDGETS.github;
const id = $props.id();

let usernameInput = $state("");
let username = $state("");
let selectedFrame = $state<Frame | undefined>(undefined);

const previewQuery = createQuery(() => ({ ...getGithubPreviewQueryOptions({ username }), enabled: !!username, retry: false }));
const scheduleQuery = createQuery(() => ({
	...getFrameScheduleQueryOptions({ frameId: selectedFrame?.id ?? "" }),
	enabled: !!selectedFrame,
}));

const preview = $derived(!username || previewQuery.isError ? null : previewQuery.data);
const scheduledUsername = $derived(scheduleQuery.data?.config.username);

$effect(() => {
	if (scheduledUsername) usernameInput = username = scheduledUsername;
});

function handleLoad(event: SubmitEvent) {
	event.preventDefault();
	username = usernameInput.trim();
}
</script>

<svelte:head>
    <title>{WIDGET.name} · Framik</title>
</svelte:head>

<div class="h-full flex flex-col gap-4">
    <div class="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div class="flex items-center gap-4">
            <img alt="{WIDGET.name} Logo" src={mode.current === 'dark'? WIDGET.logoDark : WIDGET.logoLight} class="size-8"/>
            <div>
                <h1 class="text-xl font-bold">{WIDGET.name}</h1>
                <p class="text-muted-foreground">{WIDGET.description}</p>
            </div>
        </div>

        <FrameControls schedule={preview ? { widget: "github", config: { username } } : undefined} onSelectedFrame={(frame) => (selectedFrame = frame)} />
    </div>
    <div class="flex-1 flex items-start lg:items-center justify-center">
        <div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
            <Widget
                image={preview}
                showProcessedPreview={false}
                emptyLabel={previewQuery.isError ? previewQuery.error.message : "Enter a GitHub username"}
            />

            <aside class="p-4 border rounded min-w-64 flex flex-col gap-4">
                <h1 class="font-bold">Settings</h1>
                <form class="flex flex-col gap-2" onsubmit={handleLoad}>
                    <Label for="{id}-username">GitHub username</Label>
                    <div class="flex gap-2">
                        <Input id="{id}-username" bind:value={usernameInput} placeholder="octocat" autocomplete="off" />
                        <Button type="submit" variant="secondary" disabled={!usernameInput.trim()}>Load</Button>
                    </div>
                </form>

                {#if scheduleQuery.data}
                    <p class="text-sm text-muted-foreground">
                        This frame shows GitHub/{scheduleQuery.data.config.username} daily
                        {#if scheduleQuery.data.lastPushedOn}(last pushed {scheduleQuery.data.lastPushedOn}){/if}
                    </p>
                {/if}
            </aside>
        </div>
    </div>
</div>
