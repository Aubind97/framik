import { applyFloydSteinbergDitheringNode } from "@framik/shared/node";
import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { getWidgetScreenshot } from "$lib/utils/images";

const logger = getLogger(["@framik", "api", "daemon"]);

export const daemonRoutes = new Elysia({ prefix: "/daemon" })
	.get(
		"/status",
		async ({ query }) => {
			const formattedUrl = `${query.daemonUrl}/status`;
			const status = await fetch(formattedUrl, { method: "GET" })
				.then((res) => res.json())
				.catch(() => null);
			return status as { online: boolean; version: string } | null;
		},
		{
			query: t.Object({
				daemonUrl: t.String({ format: "uri" }),
			}),
		},
	)
	.post(
		"/frame/push",
		async ({ body }) => {
			const orientation = body.orientation;
			const widgetURL = body.widgetURL;

			const base64Img = await getWidgetScreenshot({ orientation, widgetURL });
			const preparedImage = await applyFloydSteinbergDitheringNode(base64Img);

			await fetch(`${body.daemonUrl}/frame/push`, {
				method: "POST",
				body: JSON.stringify({ base64Img: preparedImage }),
				headers: { "Content-Type": "application/json" },
			})
				.then((res) => res.text())
				.then((res) => {
					logger.info`Image push response: ${res}`;
				})
				.catch((error) => {
					logger.error`Image push error: ${error}`;
					return null;
				});
		},
		{
			body: t.Object({
				daemonUrl: t.String({ format: "uri" }),
				orientation: t.String({ default: "landscape" }),
				widgetURL: t.String({ default: "https://github.com/Aubind97" }),
			}),
		},
	)
	.post(
		"/frame/clear",
		async ({ body }) => {
			const formattedUrl = `${body.daemonUrl}/frame/clear`;

			await fetch(formattedUrl, { method: "POST" })
				.then((res) => res.text())
				.then((res) => {
					logger.info`Image push response: ${res}`;
				})
				.catch((error) => {
					logger.error`Image push error: ${error}`;
					return null;
				});
		},
		{
			body: t.Object({
				daemonUrl: t.String({ format: "uri" }),
			}),
		},
	);
