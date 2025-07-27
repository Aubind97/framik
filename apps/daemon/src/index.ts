import { cron, Patterns } from "@elysiajs/cron";
import { ansiColorFormatter, configure, getConsoleSink, getLogger } from "@logtape/logtape";
import { Elysia } from "elysia";
import packageJSON from "../package.json";
import { clearFrame, MAXIMUM_UPDATE_RATE, refresh, showImageOnFrame, turnOnSleepMode, updateDate } from "./frameService";

await configure({
	sinks: {
		console: getConsoleSink({ formatter: await import("@logtape/pretty").then((module) => module.prettyFormatter).catch(() => ansiColorFormatter) }),
	},
	loggers: [
		{ category: ["logtape", "meta"], lowestLevel: undefined, sinks: ["console"] },
		{ category: ["@framik"], lowestLevel: "debug", sinks: ["console"] },
	],
});

const app = new Elysia()
	.group(
		"frame",
		{
			beforeHandle: ({ error }) => {
				// Screen updates should not be too frequent, limit the screen update rate
				if (Date.now() - (updateDate ?? 0) < MAXIMUM_UPDATE_RATE) {
					return error("Too Many Requests");
				}
			},
		},
		(app) =>
			app
				.post("/push", async () => {
					await showImageOnFrame();
				})
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
