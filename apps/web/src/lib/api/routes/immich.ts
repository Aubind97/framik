import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { isAllowedHeaderName } from "#lib/immich.ts";
import { deleteImmichCredentials, getImmichCredentials, type ImmichCredentials, requestImmich, saveImmichCredentials } from "#lib/server/immich.ts";

const logger = getLogger(["@framik", "api", "immich"]);

const ASSETS_PAGE_SIZE = 100;
const NOT_CONNECTED = "Immich is not connected";

const integrationBody = t.Object({
	url: t.String({ format: "uri" }),
	apiKey: t.String(),
	headers: t.Array(t.Object({ name: t.String(), value: t.String() })),
});

type ImmichSearchResponse = {
	assets: {
		items: { id: string; originalFileName: string; localDateTime: string }[];
		nextPage?: string | null;
		nextCursor?: string | null;
	};
};

/** Blank secrets in the body keep the stored value, so they never need to be sent back to the client. */
function mergeCredentials(body: typeof integrationBody.static, stored: ImmichCredentials | null): ImmichCredentials | { error: string } {
	const apiKey = body.apiKey || stored?.apiKey;
	if (!apiKey) return { error: "API key is required" };

	const headers = [];
	for (const header of body.headers) {
		const name = header.name.trim();
		if (!isAllowedHeaderName(name)) return { error: `Invalid header name "${name}"` };

		const value = header.value || stored?.headers.find((storedHeader) => storedHeader.name.toLowerCase() === name.toLowerCase())?.value;
		if (!value) return { error: `A value is required for header "${name}"` };

		headers.push({ name, value });
	}

	return { url: body.url, apiKey, headers };
}

export const immichRoutes = new Elysia({ prefix: "/immich" })
	.resolve(async ({ request, status }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) return status("Unauthorized");
		return { userId: session.user.id };
	})
	.get("/integration", async ({ userId }) => {
		const credentials = await getImmichCredentials(userId);
		if (!credentials) return { connected: false as const };

		return { connected: true as const, url: credentials.url, apiKeySet: true, headerNames: credentials.headers.map((header) => header.name) };
	})
	.post(
		"/integration",
		async ({ userId, body, status }) => {
			const credentials = mergeCredentials(body, await getImmichCredentials(userId));
			if ("error" in credentials) return status("Bad Request", credentials.error);

			await saveImmichCredentials(userId, credentials);
			logger.info`Immich integration saved for user ${userId}`;
		},
		{ body: integrationBody },
	)
	.delete("/integration", async ({ userId }) => {
		await deleteImmichCredentials(userId);
		logger.info`Immich integration deleted for user ${userId}`;
	})
	.post(
		"/integration/test",
		async ({ userId, body, status }) => {
			const credentials = mergeCredentials(body, await getImmichCredentials(userId));
			if ("error" in credentials) return status("Bad Request", credentials.error);

			const response = await requestImmich(credentials, "/users/me");
			if ("error" in response) return status("Bad Gateway", response.error);

			const me = (await response.json().catch(() => null)) as { name?: string; email?: string } | null;
			if (!me?.email) return status("Bad Gateway", "The URL did not answer like an Immich server");

			return { name: me.name ?? me.email, email: me.email };
		},
		{ body: integrationBody },
	)
	.get(
		"/assets",
		async ({ userId, query, status }) => {
			const credentials = await getImmichCredentials(userId);
			if (!credentials) return status("Precondition Failed", NOT_CONNECTED);

			// Legacy filters and `page` are deprecated since Immich 3.2 but still accepted; `cursor` is used once the server returns one.
			const search = { type: "IMAGE", order: "desc", visibility: "timeline", size: ASSETS_PAGE_SIZE, ...(query.cursor ? { cursor: query.cursor } : { page: query.page ?? 1 }) };
			const response = await requestImmich(credentials, "/search/metadata", {
				method: "POST",
				body: JSON.stringify(search),
				headers: { "content-type": "application/json" },
			});
			if ("error" in response) return status("Bad Gateway", response.error);

			const { assets } = (await response.json()) as ImmichSearchResponse;
			const next = assets.nextCursor ? { cursor: assets.nextCursor } : assets.nextPage ? { page: Number(assets.nextPage) } : null;

			return {
				items: assets.items.map((asset) => ({ id: asset.id, name: asset.originalFileName, takenAt: asset.localDateTime })),
				next,
			};
		},
		{ query: t.Object({ cursor: t.Optional(t.String({ minLength: 1 })), page: t.Optional(t.Numeric({ minimum: 1 })) }) },
	)
	.get(
		"/assets/:id/thumbnail",
		async ({ userId, params, query, status }) => {
			const credentials = await getImmichCredentials(userId);
			if (!credentials) return status("Precondition Failed", NOT_CONNECTED);

			const response = await requestImmich(credentials, `/assets/${params.id}/thumbnail?size=${query.size}`);
			if ("error" in response) return status("Bad Gateway", response.error);

			return new Response(response.body, {
				headers: {
					"content-type": response.headers.get("content-type") ?? "image/jpeg",
					"cache-control": "private, max-age=86400",
				},
			});
		},
		{
			params: t.Object({ id: t.String({ format: "uuid" }) }),
			query: t.Object({ size: t.Union([t.Literal("thumbnail"), t.Literal("preview")], { default: "thumbnail" }) }),
		},
	);
