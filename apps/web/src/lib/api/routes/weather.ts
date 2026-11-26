import { applyDitheringNode, toMeasuredColorsNode } from "@framik/shared/node";
import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { renderWeatherImage } from "#lib/server/frame-schedule.ts";
import { searchLocations } from "#lib/server/weather.ts";

const logger = getLogger(["@framik", "api", "weather"]);

export const weatherConfigSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 120 }),
	region: t.String({ maxLength: 120 }),
	country: t.String({ maxLength: 120 }),
	latitude: t.Numeric({ minimum: -90, maximum: 90 }),
	longitude: t.Numeric({ minimum: -180, maximum: 180 }),
	unit: t.Union([t.Literal("celsius"), t.Literal("fahrenheit")]),
	forecast: t.Union([t.Literal("days"), t.Literal("hours"), t.Literal("none")]),
});

export const weatherRoutes = new Elysia({ prefix: "/weather" })
	.get(
		"/locations",
		async ({ request, query, status }) => {
			if (!(await auth.api.getSession({ headers: request.headers }))) return status("Unauthorized");

			try {
				return await searchLocations(query.q);
			} catch (error) {
				logger.warn`Location search failed: ${error}`;
				return status("Bad Gateway", "Could not search locations");
			}
		},
		{ query: t.Object({ q: t.String({ minLength: 2, maxLength: 100 }) }) },
	)
	.get(
		"/preview",
		async ({ request, query, status }) => {
			if (!(await auth.api.getSession({ headers: request.headers }))) return status("Unauthorized");

			try {
				const dithered = await applyDitheringNode(await renderWeatherImage(query));
				return `data:image/png;base64,${await toMeasuredColorsNode(dithered)}`;
			} catch (error) {
				logger.warn`Weather preview failed: ${error}`;
				return status("Bad Gateway", "Could not load the forecast");
			}
		},
		{ query: weatherConfigSchema },
	);
