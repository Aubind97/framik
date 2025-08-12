import { applyDitheringNode } from "@framik/shared/node";
import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";

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
			const base64Img = body.image;
			const preparedImage = await applyDitheringNode(base64Img);

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
				image: t.String(),
				options: t.Optional(
					t.Object({
						gamma: t.Number({ default: 1 }),
						algorithm: t.Enum({ atkinson: "atkinson", "floyd-steinberg": "floyd-steinberg", sierra: "sierra", "sierra-two-row": "sierra-two-row" }, { default: "sierra" }),
					}),
				),
			}),
		},
	)
	.post(
		"/frame/refresh",
		async ({ body }) => {
			const formattedUrl = `${body.daemonUrl}/frame/refresh`;

			await fetch(formattedUrl, { method: "POST" })
				.then((res) => res.text())
				.then((res) => {
					logger.info`Frame refresh response: ${res}`;
				})
				.catch((error) => {
					logger.error`Frame refresh error: ${error}`;
					return null;
				});
		},
		{
			body: t.Object({
				daemonUrl: t.String({ format: "uri" }),
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
