import { getLogger } from "@logtape/logtape";
import { eq } from "drizzle-orm";
import { type GithubConfig, isScheduleDue } from "#lib/github.ts";
import { pushImageToDaemon } from "#lib/server/daemon.ts";
import { frame } from "#lib/server/db/frame.schema.ts";
import { frameSchedule } from "#lib/server/db/frame-schedule.schema.ts";
import { db } from "#lib/server/db/index.ts";
import { fetchContributions, renderContributionsSvg } from "#lib/server/github.ts";
import { getGithubIntegration } from "#lib/server/github-integration.ts";
import { fetchRepositoryActivity, renderRepositorySvg } from "#lib/server/github-repository.ts";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

const logger = getLogger(["@framik", "server", "frame-schedule"]);

async function renderGithubSvg(config: GithubConfig, userId: string): Promise<string> {
	if (config.mode === "contributions") return renderContributionsSvg(config.username, await fetchContributions(config.username));

	const integration = await getGithubIntegration(userId);
	if (!integration) throw new Error("GitHub is not connected: add a token in account settings");
	return renderRepositorySvg(await fetchRepositoryActivity(integration.token, config));
}

export async function renderGithubImage(config: GithubConfig, userId: string): Promise<string> {
	return Buffer.from(await renderGithubSvg(config, userId)).toString("base64");
}

export async function runFrameSchedule(frameId: string) {
	const [row] = await db
		.select({ apiUrl: frame.apiUrl, config: frameSchedule.config, userId: frameSchedule.userId })
		.from(frameSchedule)
		.innerJoin(frame, eq(frame.id, frameSchedule.frameId))
		.where(eq(frameSchedule.frameId, frameId));
	if (!row) return;

	await pushImageToDaemon(row.apiUrl, await renderGithubImage(row.config, row.userId));
	await db.update(frameSchedule).set({ lastPushedAt: new Date(), updatedAt: new Date() }).where(eq(frameSchedule.frameId, frameId));
	logger.info`Scheduled push to frame ${frameId} done`;
}

async function runDueSchedules() {
	const schedules = await db.select({ frameId: frameSchedule.frameId, config: frameSchedule.config, lastPushedAt: frameSchedule.lastPushedAt }).from(frameSchedule);

	for (const { frameId, config, lastPushedAt } of schedules) {
		if (!isScheduleDue(config.mode, lastPushedAt)) continue;
		await runFrameSchedule(frameId).catch((error) => logger.error`Scheduled push to frame ${frameId} failed: ${error}`);
	}
}

export function startFrameScheduler() {
	// Dev HMR re-runs the server init; one timer is enough
	const scope = globalThis as { framikScheduler?: ReturnType<typeof setInterval> };
	if (scope.framikScheduler) return;

	scope.framikScheduler = setInterval(() => runDueSchedules().catch((error) => logger.error`Schedule check failed: ${error}`), CHECK_INTERVAL_MS);
	runDueSchedules().catch((error) => logger.error`Schedule check failed: ${error}`);
}
