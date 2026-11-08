import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { isAllowedHeaderName } from "#lib/immich.ts";
import { deleteImmichCredentials, getImmichCredentials, type ImmichCredentials, requestImmich, saveImmichCredentials } from "#lib/server/immich.ts";

const logger = getLogger(["@framik", "api", "immich"]);

const NOT_CONNECTED = "Immich is not connected";

const integrationBody = t.Object({
	// A query or fragment would let the URL override the Immich API path appended to it.
	url: t.String({ pattern: "^https?://[^?#\\s]+$" }),
	apiKey: t.String(),
	headers: t.Array(t.Object({ name: t.String(), value: t.String() })),
});

const timelineQuery = {
	albumId: t.Optional(t.String({ format: "uuid" })),
	order: t.Union([t.Literal("asc"), t.Literal("desc")], { default: "desc" }),
};

type ImmichTimelineBucket = { id: string[]; isImage: boolean[]; fileCreatedAt: string[] };
type ImmichAlbum = { id: string; albumName: string; assetCount: number; order?: "asc" | "desc" };

/** The whole library is limited to the timeline (no archived or locked photos); an album shows everything it contains. */
function toTimelineParams(query: { albumId?: string; order: "asc" | "desc" }) {
	const params = new URLSearchParams({ order: query.order });
	if (query.albumId) params.set("albumId", query.albumId);
	else params.set("visibility", "timeline");
	return params;
}

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
	.onError(({ code, error, path }) => {
		if (code === "UNKNOWN" || code === "INTERNAL_SERVER_ERROR") logger.error`${path} failed: ${error}`;
	})
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
	.get("/albums", async ({ userId, status }) => {
		const credentials = await getImmichCredentials(userId);
		if (!credentials) return status("Precondition Failed", NOT_CONNECTED);

		const [owned, shared] = await Promise.all([requestImmich(credentials, "/albums?isOwned=true"), requestImmich(credentials, "/albums?isOwned=false")]);
		if ("error" in owned) return status("Bad Gateway", owned.error);
		if ("error" in shared) return status("Bad Gateway", shared.error);

		const toAlbum = (album: ImmichAlbum) => ({ id: album.id, name: album.albumName, assetCount: album.assetCount, order: album.order ?? "desc" });
		const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
		return {
			owned: ((await owned.json()) as ImmichAlbum[]).map(toAlbum).sort(byName),
			shared: ((await shared.json()) as ImmichAlbum[]).map(toAlbum).sort(byName),
		};
	})
	.get(
		"/timeline/buckets",
		async ({ userId, query, status }) => {
			const credentials = await getImmichCredentials(userId);
			if (!credentials) return status("Precondition Failed", NOT_CONNECTED);

			const response = await requestImmich(credentials, `/timeline/buckets?${toTimelineParams(query)}`);
			if ("error" in response) return status("Bad Gateway", response.error);

			return (await response.json()) as { timeBucket: string; count: number }[];
		},
		{ query: t.Object(timelineQuery) },
	)
	.get(
		"/timeline/bucket",
		async ({ userId, query, status }) => {
			const credentials = await getImmichCredentials(userId);
			if (!credentials) return status("Precondition Failed", NOT_CONNECTED);

			const params = toTimelineParams(query);
			params.set("timeBucket", query.timeBucket);
			const response = await requestImmich(credentials, `/timeline/bucket?${params}`);
			if ("error" in response) return status("Bad Gateway", response.error);

			const bucket = (await response.json()) as ImmichTimelineBucket;
			return {
				items: bucket.id.flatMap((id, index) => (bucket.isImage[index] ? [{ id, takenAt: bucket.fileCreatedAt[index] }] : [])),
			};
		},
		{ query: t.Object({ ...timelineQuery, timeBucket: t.String({ minLength: 1 }) }) },
	)
	.get(
		"/assets/:id/thumbnail",
		async ({ userId, params, query, status }) => {
			const credentials = await getImmichCredentials(userId);
			if (!credentials) return status("Precondition Failed", NOT_CONNECTED);

			const response = await requestImmich(credentials, `/assets/${params.id}/thumbnail?size=${query.size}`);
			if ("error" in response) return status("Bad Gateway", response.error);

			// Served from our origin, so anything else (HTML, SVG) could run scripts here.
			const contentType = response.headers.get("content-type");
			if (contentType !== "image/jpeg" && contentType !== "image/webp") return status("Bad Gateway", "Immich did not return a JPEG or WebP image");

			return new Response(response.body, {
				headers: {
					"content-type": contentType,
					"x-content-type-options": "nosniff",
					"cache-control": "private, max-age=86400",
				},
			});
		},
		{
			params: t.Object({ id: t.String({ format: "uuid" }) }),
			query: t.Object({ size: t.Union([t.Literal("thumbnail"), t.Literal("preview")], { default: "thumbnail" }) }),
		},
	);
