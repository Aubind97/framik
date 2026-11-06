import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
	PUBLIC_DOMAIN: { public: true, static: true },
	DATABASE_URL: {},
	BETTER_AUTH_SECRET: {},
});
