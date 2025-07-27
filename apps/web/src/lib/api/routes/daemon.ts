import { Elysia, t } from "elysia";

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
			const formattedUrl = `${body.daemonUrl}/frame/push`;

			await fetch(formattedUrl, { method: "POST" })
				.then((res) => res.json())
				.catch(() => null);
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
				.then((res) => res.json())
				.catch(() => null);
		},
		{
			body: t.Object({
				daemonUrl: t.String({ format: "uri" }),
			}),
		},
	);
