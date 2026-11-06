import { cron, Patterns } from "@elysiajs/cron";
import { ansiColorFormatter, configure, getConsoleSink, getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import sharp from "sharp";
import packageJSON from "../package.json";
import { CURRENT_IMAGE, clearFrame, refresh, showImageOnFrame, turnOnSleepMode } from "./frameService";

await configure({
	sinks: {
		console: getConsoleSink({ formatter: await import("@logtape/pretty").then((module) => module.prettyFormatter).catch(() => ansiColorFormatter) }),
	},
	loggers: [
		{ category: ["logtape", "meta"], lowestLevel: undefined, sinks: ["console"] },
		{ category: ["@framik"], lowestLevel: "debug", sinks: ["console"] },
	],
});

const logger = getLogger(["@framik", "api"]);

let isProcessing = false;
let updateDate: number | null = null;

// To avoid screen burning, avoid updating the screen more than 15 seconds
export const MAXIMUM_UPDATE_RATE = 15 * 1000;

// The lock lives with the work, not in request hooks: afterResponse also fires for rejected requests
async function withFrameLock(task: () => Promise<unknown>) {
	if (isProcessing) {
		return false;
	}

	isProcessing = true;
	try {
		await task();
	} finally {
		isProcessing = false;
		updateDate = Date.now();
	}
	return true;
}

const app = new Elysia({ serve: { idleTimeout: 30 } })
	.group(
		"frame",
		{
			beforeHandle: ({ status }) => {
				// Screen updates should not be too frequent, limit the screen update rate
				if (Date.now() - (updateDate ?? 0) < MAXIMUM_UPDATE_RATE) {
					return status("Too Many Requests");
				}
			},
		},
		(app) =>
			app
				.post(
					"/push",
					async ({ body, status }) => {
						logger.info`Image received`;
						const imageData = Buffer.from(body.base64Img, "base64");

						const { data: rgbBuffer, info } = await sharp(imageData).resize(800, 480).removeAlpha().raw().toBuffer({ resolveWithObject: true });

						const done = await withFrameLock(async () => {
							await sharp(rgbBuffer, { raw: info }).png().toFile(CURRENT_IMAGE);
							await showImageOnFrame(rgbBuffer, { width: info.width, height: info.height });
						});
						if (!done) return status("Conflict");
					},
					{ body: t.Object({ base64Img: t.String() }) },
				)
				.post("/refresh", async ({ status }) => {
					if (!(await withFrameLock(refresh))) return status("Conflict");
				})
				.post("/clear", async ({ status }) => {
					const done = await withFrameLock(async () => {
						await clearFrame();
						await turnOnSleepMode();
					});
					if (!done) return status("Conflict");
				}),
	)
	.use(
		cron({
			name: "heartbeat",
			pattern: Patterns.EVERY_12_HOURS,
			run: async () => {
				// To preserve a good integrity, the display should be refreshed at least every 24h
				const HOURS_12 = 12 * 60 * 60 * 1000;
				if (Date.now() - (updateDate ?? 0) > HOURS_12) {
					await withFrameLock(refresh);
				}
			},
		}),
	)
	.get("/frame/current", async () => {
		const base64 = Buffer.from(await Bun.file(CURRENT_IMAGE).arrayBuffer()).toString("base64");

		return `data:image/png;base64,${base64}`;
	})
	.get("/status", () => ({
		online: true,
		version: packageJSON.version,
	}))
	.listen(3000);

getLogger(["@framik"]).info(`Server running at ${app.server?.hostname}:${app.server?.port}`);
