import { getLogger } from "@logtape/logtape";
import { eq } from "drizzle-orm";
import { createCipher } from "#lib/server/crypto.ts";
import { db } from "#lib/server/db/index.ts";
import { githubIntegration } from "#lib/server/db/integration.schema.ts";
import { BETTER_AUTH_SECRET } from "$app/env/private";

const logger = getLogger(["@framik", "server", "github"]);

const cipher = createCipher(BETTER_AUTH_SECRET, "framik:github-integration");

export async function getGithubIntegration(userId: string): Promise<{ login: string; token: string } | null> {
	const [row] = await db.select().from(githubIntegration).where(eq(githubIntegration.userId, userId));
	if (!row) return null;

	try {
		return { login: row.login, token: cipher.decrypt(row.secret) };
	} catch (error) {
		// Happens when BETTER_AUTH_SECRET changed: treat as disconnected so the user re-enters the token.
		logger.warn`Could not decrypt GitHub token for user ${userId}: ${error}`;
		return null;
	}
}

export async function saveGithubIntegration(userId: string, { login, token }: { login: string; token: string }) {
	const values = { login, secret: cipher.encrypt(token), updatedAt: new Date() };
	await db
		.insert(githubIntegration)
		.values({ userId, ...values })
		.onConflictDoUpdate({ target: githubIntegration.userId, set: values });
}

export async function deleteGithubIntegration(userId: string) {
	await db.delete(githubIntegration).where(eq(githubIntegration.userId, userId));
}
