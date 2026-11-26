<script lang="ts">
import { KeyRound } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { mode as theme } from "mode-watcher";
import { getFrameScheduleQueryOptions } from "#lib/api/fetch/frame.ts";
import { getGithubIntegrationQueryOptions, getGithubPreviewQueryOptions, getGithubReposQueryOptions } from "#lib/api/fetch/github.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import { Input } from "#lib/components/ui/input/index.ts";
import Label from "#lib/components/ui/label/label.svelte";
import * as Select from "#lib/components/ui/select/index.ts";
import { Switch } from "#lib/components/ui/switch/index.ts";
import FrameControls from "#lib/components/utils/frame-controls.svelte";
import Widget from "#lib/components/widgets/core/widget.svelte";
import { INTEGRATIONS, WIDGETS } from "#lib/constants.ts";
import { GITHUB_MODES, GITHUB_REPO_PATTERN, type GithubConfig, type GithubMode, REPOSITORY_LIMITS, validateGithubConfig } from "#lib/github.ts";
import type { Frame } from "#lib/server/db/types.ts";

const WIDGET = WIDGETS.github;
const id = $props.id();

let mode = $state<GithubMode>("contributions");
let username = $state("");
let icon = $state<"github" | "avatar">("avatar");
let repo = $state("");
let commits = $state(5);
let pulls = $state(3);
let config = $state<GithubConfig | undefined>(undefined);
let selectedFrame = $state<Frame | undefined>(undefined);

const integrationQuery = createQuery(() => getGithubIntegrationQueryOptions());
const hasToken = $derived(integrationQuery.data?.connected ?? false);
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

const preview = $derived(!config || previewQuery.isError ? null : previewQuery.data);
const draft = $derived(buildDraft());
const draftError = $derived(validateGithubConfig(draft));
const isFilled = $derived(isComplete(draft));
const canLoad = $derived(isFilled && !draftError && (!GITHUB_MODES[mode].needsToken || hasToken));
// The schedule row does not tie its config type to its widget
const githubSchedule = $derived(scheduleQuery.data?.widget === "github" ? { ...scheduleQuery.data, config: scheduleQuery.data.config as GithubConfig } : undefined);
// Serialised so a background refetch of the same schedule does not reset the fields
const scheduledConfig = $derived(githubSchedule && JSON.stringify(githubSchedule.config));

/** Accepts `owner/name` or a pasted GitHub URL. */
function toRepoName(input: string) {
	return input
		.trim()
		.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "")
		.replace(/(\.git)?\/*$/, "");
}

function buildDraft(): GithubConfig {
	switch (mode) {
		case "contributions":
			return { mode, username: username.trim(), icon };
		case "repository":
			return { mode, repo: toRepoName(repo), commits, pulls };
		case "releases":
			return { mode };
	}
}

function isComplete(next: GithubConfig) {
	switch (next.mode) {
		case "contributions":
			return !!next.username;
		case "repository":
			return new RegExp(GITHUB_REPO_PATTERN).test(next.repo) && Number.isInteger(next.commits) && Number.isInteger(next.pulls);
		case "releases":
			return true;
	}
}

function applyConfig(next: GithubConfig) {
	mode = next.mode;
	if (next.mode === "contributions") ({ username, icon } = next);
	if (next.mode === "repository") ({ repo, commits, pulls } = next);
	config = next;
}

function handleIconChange(showAvatar: boolean) {
	icon = showAvatar ? "avatar" : "github";
	// Refresh a loaded preview right away instead of waiting for "Load preview"
	if (config?.mode === "contributions") config = { ...config, icon };
}

function handleLoad(event: SubmitEvent) {
	event.preventDefault();
	if (canLoad) config = draft;
}

function describe(scheduled: GithubConfig) {
	switch (scheduled.mode) {
		case "contributions":
			return `GitHub/${scheduled.username}`;
		case "repository":
			return `${scheduled.repo} activity`;
		case "releases":
			return "your releases feed";
	}
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
                    {#if integrationQuery.isSuccess && !hasToken}
                        <div class="rounded-md border bg-muted/40 p-3 text-sm flex flex-col gap-2">
                            <p class="text-muted-foreground">Repository activity and the releases feed read your GitHub data, so they need a GitHub token first.</p>
                            <Button href={INTEGRATIONS.github.settingsUrl} variant="outline" size="sm">
                                <KeyRound />
                                Add a GitHub token
                            </Button>
                        </div>
                    {/if}
                </div>

                <form class="flex flex-col gap-4" onsubmit={handleLoad}>
                    {#if mode === "contributions"}
                        <div class="flex flex-col gap-2">
                            <Label for="{id}-username">GitHub username</Label>
                            <Input id="{id}-username" bind:value={username} placeholder="octocat" autocomplete="off" />
                        </div>
                        <div class="flex items-center justify-between gap-3">
                            <Label for="{id}-avatar" class="font-normal">Show the user's avatar instead of the GitHub logo</Label>
                            <Switch id="{id}-avatar" checked={icon === "avatar"} onCheckedChange={handleIconChange} />
                        </div>
                    {:else if mode === "repository"}
                        <div class="flex flex-col gap-2">
                            <Label for="{id}-repo">Repository</Label>
                            <Input id="{id}-repo" bind:value={repo} placeholder="owner/name" autocomplete="off" list="{id}-repos" />
                            <p class="text-xs text-muted-foreground">Pick one of yours, or type any public repository as owner/name or its GitHub URL.</p>
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
                    {:else if mode === "releases"}
                        <p class="text-sm text-muted-foreground">The latest releases of the repositories you star or watch on GitHub.</p>
                    {/if}

                    {#if draftError}
                        <p class="text-destructive text-sm">{draftError}</p>
                    {/if}
                    <Button type="submit" variant="secondary" disabled={!canLoad}>Load preview</Button>
                </form>

                {#if previewQuery.isError && config && GITHUB_MODES[config.mode].needsToken && hasToken}
                    <Button href={INTEGRATIONS.github.settingsUrl} variant="outline" size="sm">
                        <KeyRound />
                        Check your GitHub token
                    </Button>
                {/if}

                {#if githubSchedule}
                    <p class="text-sm text-muted-foreground">
                        This frame shows {describe(githubSchedule.config)}, refreshed {GITHUB_MODES[githubSchedule.config.mode].refresh.toLowerCase()}
                        {#if githubSchedule.lastPushedAt}(last pushed {new Date(githubSchedule.lastPushedAt).toLocaleString()}){/if}
                    </p>
                {/if}
            </aside>
        </div>
    </div>
</div>
