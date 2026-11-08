import { getLogger } from "@logtape/logtape";
import { Elysia, t } from "elysia";
import { auth } from "#lib/auth.ts";
import { isAllowedHeaderName } from "#lib/immich.ts";
import { deleteImmichCredentials, describeImmichError, getImmichCredentials, type ImmichCredentials, immichFetch, saveImmichCredentials } from "#lib/server/immich.ts";

const logger = getLogger(["@framik", "api", "immich"]);

const integrationBody = t.Object({
	url: t.String({ format: "uri" }),
	apiKey: t.String(),
	headers: t.Array(t.Object({ name: t.String(), value: t.String() })),
});

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

			const response = await immichFetch(credentials, "/users/me").catch((error: Error) => error);
			if (response instanceof Error) return status("Bad Gateway", `Could not reach Immich: ${response.message}`);
			if (!response.ok) return status("Bad Gateway", await describeImmichError(response));

			const me = (await response.json().catch(() => null)) as { name?: string; email?: string } | null;
			if (!me?.email) return status("Bad Gateway", "The URL did not answer like an Immich server");

			return { name: me.name ?? me.email, email: me.email };
		},
		{ body: integrationBody },
	);
