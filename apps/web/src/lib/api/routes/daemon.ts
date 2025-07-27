import { Elysia, t } from "elysia";

export const daemonRoutes = new Elysia({ prefix: "/daemon" }).get(
	"/status",
	async ({ query }) => {
		const formattedUrl = `${query.daemonUrl}/status`;
		const status = await fetch(formattedUrl, { method: "GET" }).then((res) => res.json()).catch(() => null);
		return status as { online: boolean; version: string } | null;
	},
	{
		query: t.Object({
			daemonUrl: t.String({ format: "uri" }),
		}),
	},
);
