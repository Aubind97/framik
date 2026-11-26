import { getLogger } from "@logtape/logtape";
import { eq, isNull, ne, or } from "drizzle-orm";
import { pushImageToDaemon } from "#lib/server/daemon.ts";
import { frame } from "#lib/server/db/frame.schema.ts";
import { frameSchedule } from "#lib/server/db/frame-schedule.schema.ts";
import { db } from "#lib/server/db/index.ts";
import { fetchContributions, renderContributionsSvg } from "#lib/server/github.ts";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

const logger = getLogger(["@framik", "server", "frame-schedule"]);

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export async function renderGithubImage(username: string): Promise<string> {
	return Buffer.from(renderContributionsSvg(username, await fetchContributions(username))).toString("base64");
}

export async function runFrameSchedule(frameId: string) {
	const [row] = await db
		.select({ apiUrl: frame.apiUrl, config: frameSchedule.config })
		.from(frameSchedule)
		.innerJoin(frame, eq(frame.id, frameSchedule.frameId))
		.where(eq(frameSchedule.frameId, frameId));
	if (!row) return;

	await pushImageToDaemon(row.apiUrl, await renderGithubImage(row.config.username));
	await db.update(frameSchedule).set({ lastPushedOn: localDate(), updatedAt: new Date() }).where(eq(frameSchedule.frameId, frameId));
	logger.info`Scheduled push to frame ${frameId} done`;
}

async function runDueSchedules() {
	const due = await db
		.select({ frameId: frameSchedule.frameId })
		.from(frameSchedule)
		.where(or(isNull(frameSchedule.lastPushedOn), ne(frameSchedule.lastPushedOn, localDate())));

	for (const { frameId } of due) {
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
