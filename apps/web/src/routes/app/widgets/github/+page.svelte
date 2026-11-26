<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { mode as theme } from "mode-watcher";
import { getFrameScheduleQueryOptions } from "#lib/api/fetch/frame.ts";
import { getGithubIntegrationQueryOptions, getGithubPreviewQueryOptions, getGithubReposQueryOptions } from "#lib/api/fetch/github.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import { Input } from "#lib/components/ui/input/index.ts";
import Label from "#lib/components/ui/label/label.svelte";
import * as Select from "#lib/components/ui/select/index.ts";
import FrameControls from "#lib/components/utils/frame-controls.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import { INTEGRATIONS, WIDGETS } from "#lib/constants.ts";
import { GITHUB_MODES, GITHUB_REPO_PATTERN, type GithubConfig, type GithubMode, REPOSITORY_LIMITS, validateGithubConfig } from "#lib/github.ts";
import type { Frame } from "#lib/server/db/types.ts";

const WIDGET = WIDGETS.github;
const id = $props.id();

let mode = $state<GithubMode>("contributions");
let username = $state("");
let repo = $state("");
let commits = $state(5);
let pulls = $state(3);
let config = $state<GithubConfig | undefined>(undefined);
let selectedFrame = $state<Frame | undefined>(undefined);

const integrationQuery = createQuery(() => getGithubIntegrationQueryOptions());
const reposQuery = createQuery(() => ({ ...getGithubReposQueryOptions(), enabled: hasToken && mode === "repository" }));
const previewQuery = createQuery(() => ({
	// biome-ignore lint/style/noNonNullAssertion: can't be null since the query will be disabled
	...getGithubPreviewQueryOptions(config!),
	enabled: !!config,
	retry: false,
}));
const scheduleQuery = createQuery(() => ({
	...getFrameScheduleQueryOptions({ frameId: selectedFrame?.id ?? "" }),
	enabled: !!selectedFrame,
}));

const hasToken = $derived(integrationQuery.data?.connected ?? false);
const preview = $derived(!config || previewQuery.isError ? null : previewQuery.data);
const draft = $derived<GithubConfig>(mode === "repository" ? { mode, repo: repo.trim(), commits, pulls } : { mode: "contributions", username: username.trim() });
const draftError = $derived(validateGithubConfig(draft));
const isFilled = $derived(
	draft.mode === "contributions" ? !!draft.username : new RegExp(GITHUB_REPO_PATTERN).test(draft.repo) && Number.isInteger(draft.commits) && Number.isInteger(draft.pulls),
);
const canLoad = $derived(isFilled && !draftError && (!GITHUB_MODES[mode].needsToken || hasToken));
// Serialised so a background refetch of the same schedule does not reset the fields
const scheduledConfig = $derived(scheduleQuery.data ? JSON.stringify(scheduleQuery.data.config) : undefined);

function applyConfig(next: GithubConfig) {
	mode = next.mode;
	if (next.mode === "contributions") username = next.username;
	if (next.mode === "repository") ({ repo, commits, pulls } = next);
	config = next;
}

function handleLoad(event: SubmitEvent) {
	event.preventDefault();
	if (canLoad) config = draft;
}

function describe(scheduled: GithubConfig) {
	return scheduled.mode === "contributions" ? `GitHub/${scheduled.username}` : `${scheduled.repo} activity`;
}

$effect(() => {
	if (scheduledConfig) applyConfig(JSON.parse(scheduledConfig));
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

        <FrameControls schedule={preview && config ? { widget: "github", config } : undefined} onSelectedFrame={(frame) => (selectedFrame = frame)} />
    </div>
    <div class="flex-1 flex items-start lg:items-center justify-center">
        <div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
            <Widget
                image={preview}
                showProcessedPreview={false}
                emptyLabel={previewQuery.isError ? previewQuery.error.message : "Pick a mode and load a preview"}
            />

            <aside class="p-4 border rounded min-w-64 lg:w-72 flex flex-col gap-4">
                <h1 class="font-bold">Settings</h1>

                <div class="flex flex-col gap-2">
                    <Label for="{id}-mode">Mode</Label>
                    <Select.Root type="single" bind:value={mode}>
                        <Select.Trigger id="{id}-mode" class="w-full">{GITHUB_MODES[mode].label}</Select.Trigger>
                        <Select.Content>
                            {#each Object.entries(GITHUB_MODES) as [value, option] (value)}
                                <Select.Item {value} label={option.label} disabled={option.needsToken && !hasToken}>
                                    {option.label}
                                    <span class="ml-auto text-xs text-muted-foreground">{option.refresh}</span>
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                    {#if !hasToken && Object.values(GITHUB_MODES).some((option) => option.needsToken)}
                        <p class="text-xs text-muted-foreground">
                            <a class="underline" href={INTEGRATIONS.github.settingsUrl}>Add a GitHub token</a> to unlock the other modes.
                        </p>
                    {/if}
                </div>

                <form class="flex flex-col gap-4" onsubmit={handleLoad}>
                    {#if mode === "contributions"}
                        <div class="flex flex-col gap-2">
                            <Label for="{id}-username">GitHub username</Label>
                            <Input id="{id}-username" bind:value={username} placeholder="octocat" autocomplete="off" />
                        </div>
                    {:else if mode === "repository"}
                        <div class="flex flex-col gap-2">
                            <Label for="{id}-repo">Repository</Label>
                            <Input id="{id}-repo" bind:value={repo} placeholder="owner/name" autocomplete="off" list="{id}-repos" />
                            <datalist id="{id}-repos">
                                {#each reposQuery.data ?? [] as name (name)}
                                    <option value={name}></option>
                                {/each}
                            </datalist>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="flex flex-col gap-2">
                                <Label for="{id}-commits">Last commits</Label>
                                <Input id="{id}-commits" type="number" min={1} max={REPOSITORY_LIMITS.commits} bind:value={commits} />
                            </div>
                            <div class="flex flex-col gap-2">
                                <Label for="{id}-pulls">Open PRs</Label>
                                <Input id="{id}-pulls" type="number" min={0} max={REPOSITORY_LIMITS.pulls} bind:value={pulls} />
                            </div>
                        </div>
                        <p class="text-xs text-muted-foreground">Up to {REPOSITORY_LIMITS.rows} rows fit on the frame.</p>
                    {/if}

                    {#if draftError}
                        <p class="text-destructive text-sm">{draftError}</p>
                    {/if}
                    <Button type="submit" variant="secondary" disabled={!canLoad}>Load preview</Button>
                </form>

                {#if scheduleQuery.data}
                    <p class="text-sm text-muted-foreground">
                        This frame shows {describe(scheduleQuery.data.config)}, refreshed {GITHUB_MODES[scheduleQuery.data.config.mode].refresh.toLowerCase()}
                        {#if scheduleQuery.data.lastPushedAt}(last pushed {new Date(scheduleQuery.data.lastPushedAt).toLocaleString()}){/if}
                    </p>
                {/if}
            </aside>
        </div>
    </div>
</div>
