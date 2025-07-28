import { edenFetch } from "@elysiajs/eden";
import { PUBLIC_DOMAIN } from "$env/static/public";

import type { InternalAPI } from "../../../routes/api/[...slugs]/+server";

export const getFetcher = (fetch?: typeof globalThis.fetch) => edenFetch<InternalAPI>(PUBLIC_DOMAIN, { fetcher: fetch });
