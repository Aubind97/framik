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

const app = new Elysia({ serve: { idleTimeout: 30 } })
	.group(
		"frame",
		{
			beforeHandle: ({ status }) => {
				// If the frame is in use reject
				if (isProcessing) {
					return status("Conflict");
				}

				// Screen updates should not be too frequent, limit the screen update rate
				if (Date.now() - (updateDate ?? 0) < MAXIMUM_UPDATE_RATE) {
					return status("Too Many Requests");
				}

				isProcessing = true;
			},
			afterResponse: () => {
				isProcessing = false;
				updateDate = Date.now();
			},
		},
		(app) =>
			app
				.post(
					"/push",
					async ({ body }) => {
						logger.info`Image received`;
						const imageData = Buffer.from(body.base64Img, "base64");

						const { data: rgbBuffer, info } = await sharp(imageData).resize(800, 480).removeAlpha().raw().toBuffer({ resolveWithObject: true });
						await sharp(imageData).resize(800, 480).removeAlpha().png().toFile(CURRENT_IMAGE);

						await showImageOnFrame(rgbBuffer, { width: info.width, height: info.height });
					},
					{ body: t.Object({ base64Img: t.String() }) },
				)
				.post("/refresh", refresh)
				.post("/clear", async () => {
					await clearFrame();
					await turnOnSleepMode();
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
					await refresh();
				}
			},
		}),
	)
	.get("/status", () => ({
		online: true,
		version: packageJSON.version,
	}))
	.listen(3000);

getLogger(["@framik"]).info(`Server running at ${app.server?.hostname}:${app.server?.port}`);
