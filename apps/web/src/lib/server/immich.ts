import { eq } from "drizzle-orm";
import { type ImmichHeader, normalizeImmichUrl } from "#lib/immich.ts";
import { createCipher } from "#lib/server/crypto.ts";
import { db } from "#lib/server/db/index.ts";
import { immichIntegration } from "#lib/server/db/integration.schema.ts";
import { BETTER_AUTH_SECRET } from "$app/env/private";

export type ImmichCredentials = { url: string; apiKey: string; headers: ImmichHeader[] };
type ImmichSecret = Pick<ImmichCredentials, "apiKey" | "headers">;

const REQUEST_TIMEOUT_MS = 15_000;

const cipher = createCipher(BETTER_AUTH_SECRET, "framik:immich-integration");

export async function getImmichCredentials(userId: string): Promise<ImmichCredentials | null> {
	const [row] = await db.select().from(immichIntegration).where(eq(immichIntegration.userId, userId));
	if (!row) return null;

	const secret = JSON.parse(cipher.decrypt(row.secret)) as ImmichSecret;
	return { url: row.url, ...secret };
}

export async function saveImmichCredentials(userId: string, { url, apiKey, headers }: ImmichCredentials) {
	const values = { url: normalizeImmichUrl(url), secret: cipher.encrypt(JSON.stringify({ apiKey, headers } satisfies ImmichSecret)), updatedAt: new Date() };
	await db
		.insert(immichIntegration)
		.values({ userId, ...values })
		.onConflictDoUpdate({ target: immichIntegration.userId, set: values });
}

export async function deleteImmichCredentials(userId: string) {
	await db.delete(immichIntegration).where(eq(immichIntegration.userId, userId));
}

export function immichFetch(credentials: ImmichCredentials, path: string, init: RequestInit = {}) {
	const headers = new Headers(init.headers);
	for (const { name, value } of credentials.headers) headers.set(name, value);
	headers.set("x-api-key", credentials.apiKey);

	return fetch(`${normalizeImmichUrl(credentials.url)}/api${path}`, { ...init, headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

export async function describeImmichError(response: Response) {
	const body = await response.json().catch(() => null);
	const message = typeof body?.message === "string" ? body.message : response.statusText;
	return `Immich responded ${response.status}${message ? `: ${message}` : ""}`;
}
