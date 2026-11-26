const REQUEST_TIMEOUT_MS = 15_000;

async function githubFetch(token: string, path: string, init: RequestInit = {}) {
	const response = await fetch(`https://api.github.com${path}`, {
		...init,
		headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
		redirect: "error",
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	if (response.status === 401) throw new Error("GitHub refused your token: it may have expired or been revoked. Update it in your account settings");
	if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
	return response;
}

export async function githubRest<T>(token: string, path: string): Promise<T> {
	return (await githubFetch(token, path)).json() as Promise<T>;
}

export async function githubGraphql<T>(token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
	const response = await githubFetch(token, "/graphql", { method: "POST", body: JSON.stringify({ query, variables }) });
	const { data, errors } = (await response.json()) as { data?: T; errors?: { message: string }[] };
	if (errors?.length || !data) throw new Error(errors?.[0]?.message ?? "GitHub returned no data");
	return data;
}
