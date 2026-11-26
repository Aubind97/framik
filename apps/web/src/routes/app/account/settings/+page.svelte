<script lang="ts">
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import { mode } from "mode-watcher";
import { toast } from "svelte-sonner";
import { deleteGithubIntegration, getGithubIntegrationQueryOptions, saveGithubIntegration } from "#lib/api/fetch/github.ts";
import { deleteImmichIntegration, getImmichIntegrationQueryOptions, type ImmichIntegrationBody, saveImmichIntegration, testImmichIntegration } from "#lib/api/fetch/immich.ts";
import { getErrorMessage } from "#lib/api/fetch/index.ts";
import GithubIntegrationForm from "#lib/components/forms/github-integration.form.svelte";
import ImmichIntegrationForm from "#lib/components/forms/immich-integration.form.svelte";
import type { ImmichIntegrationFormValue } from "#lib/components/forms/utils/schemas.ts";
import { Badge } from "#lib/components/ui/badge/index.ts";
import * as Card from "#lib/components/ui/card/index.ts";
import { Skeleton } from "#lib/components/ui/skeleton/index.ts";
import { WIDGETS } from "#lib/constants.ts";

const queryClient = useQueryClient();
const integrationQuery = createQuery(() => getImmichIntegrationQueryOptions());
const githubQuery = createQuery(() => getGithubIntegrationQueryOptions());

function toBody(value: ImmichIntegrationFormValue): ImmichIntegrationBody {
	return { url: value.url, apiKey: value.apiKey, headers: value.headers.map((header) => ({ name: header.name.trim(), value: header.value })) };
}

async function handleTest(value: ImmichIntegrationFormValue) {
	const { data, error } = await testImmichIntegration(toBody(value));
	if (error) {
		toast.error(getErrorMessage(error));
		return;
	}
	toast.success(`Connected to Immich as ${data.name}`);
}

async function handleSave(value: ImmichIntegrationFormValue) {
	const { error } = await saveImmichIntegration(toBody(value));
	if (error) {
		toast.error(getErrorMessage(error));
		return;
	}
	await queryClient.invalidateQueries({ queryKey: ["immich"] });
	toast.success("Immich integration saved");
}

async function handleDisconnect() {
	const { error } = await deleteImmichIntegration();
	if (error) {
		toast.error(getErrorMessage(error));
		return;
	}
	queryClient.removeQueries({ queryKey: ["immich"] });
	await queryClient.invalidateQueries({ queryKey: ["immich", "integration"] });
	toast.success("Immich disconnected");
}

async function handleGithubSave(token: string) {
	const { data, error } = await saveGithubIntegration({ token });
	if (error) {
		toast.error(getErrorMessage(error));
		return;
	}
	await queryClient.invalidateQueries({ queryKey: ["github"] });
	toast.success(`Connected to GitHub as ${data.login}`);
}

async function handleGithubDisconnect() {
	const { error } = await deleteGithubIntegration();
	if (error) {
		toast.error(getErrorMessage(error));
		return;
	}
	await queryClient.invalidateQueries({ queryKey: ["github"] });
	toast.success("GitHub disconnected");
}
</script>

<svelte:head>
    <title>Account settings · Framik</title>
</svelte:head>

<div class="max-w-prose w-full mx-auto flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Account settings</h1>

    <section class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold">Integrations</h2>

        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <img alt="Immich logo" src={WIDGETS.immich.logoLight} class="size-8" />
                    <div class="flex-1">
                        <Card.Title>Immich</Card.Title>
                        <Card.Description>Connect your Immich server to show your photos on a frame.</Card.Description>
                    </div>
                    {#if integrationQuery.isSuccess}
                        <Badge variant={integrationQuery.data.connected ? "default" : "outline"}>{integrationQuery.data.connected ? "Connected" : "Not connected"}</Badge>
                    {/if}
                </div>
            </Card.Header>
            <Card.Content>
                {#if integrationQuery.isSuccess}
                    {#key integrationQuery.data}
                        <ImmichIntegrationForm stored={integrationQuery.data.connected ? integrationQuery.data : null} {handleSave} {handleTest} {handleDisconnect} />
                    {/key}
                {:else if integrationQuery.isError}
                    <p class="text-destructive text-sm">Could not load the Immich integration: {integrationQuery.error.message}</p>
                {:else}
                    <Skeleton class="h-48 w-full" />
                {/if}
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <img alt="GitHub logo" src={mode.current === "dark" ? WIDGETS.github.logoDark : WIDGETS.github.logoLight} class="size-8" />
                    <div class="flex-1">
                        <Card.Title>GitHub</Card.Title>
                        <Card.Description>Add a token to show repository activity and releases on a frame.</Card.Description>
                    </div>
                    {#if githubQuery.isSuccess}
                        <Badge variant={githubQuery.data.connected ? "default" : "outline"}>{githubQuery.data.connected ? "Connected" : "Not connected"}</Badge>
                    {/if}
                </div>
            </Card.Header>
            <Card.Content>
                {#if githubQuery.isSuccess}
                    {#key githubQuery.data}
                        <GithubIntegrationForm login={githubQuery.data.connected ? githubQuery.data.login : null} handleSave={handleGithubSave} handleDisconnect={handleGithubDisconnect} />
                    {/key}
                {:else if githubQuery.isError}
                    <p class="text-destructive text-sm">Could not load the GitHub integration: {githubQuery.error.message}</p>
                {:else}
                    <Skeleton class="h-48 w-full" />
                {/if}
            </Card.Content>
        </Card.Root>
    </section>
</div>
