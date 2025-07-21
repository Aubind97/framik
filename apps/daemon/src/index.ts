import { cron, Patterns } from "@elysiajs/cron";
import { ansiColorFormatter, configure, getConsoleSink, getLogger } from "@logtape/logtape";
import { Elysia, error } from "elysia";
import packageJSON from "../package.json";
import { clearFrame, refresh, turnOnSleepMode, updateDate } from "./frameService";

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
	.post("/push", () => {
		getLogger(["@framik"]).fatal(`Implement frame image update`);
		return error("Not Implemented");
	})
	.post("/clear", async () => {
		await clearFrame();
		await turnOnSleepMode();
	})
	.get("/status", () => ({
		online: true,
		version: packageJSON.version,
	}))
	.listen(3000);

getLogger(["@framik"]).info(`Server running at ${app.server?.hostname}:${app.server?.port}`);
