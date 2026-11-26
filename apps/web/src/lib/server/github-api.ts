const REQUEST_TIMEOUT_MS = 15_000;

export async function githubGraphql<T>(token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		body: JSON.stringify({ query, variables }),
		redirect: "error",
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	if (response.status === 401) throw new Error("GitHub refused your token: it may have expired or been revoked. Update it in your account settings");
	if (!response.ok) throw new Error(`GitHub responded ${response.status}`);

	const { data, errors } = (await response.json()) as { data?: T; errors?: { message: string }[] };
	if (errors?.length || !data) throw new Error(errors?.[0]?.message ?? "GitHub returned no data");
	return data;
}
