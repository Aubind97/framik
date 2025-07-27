import { edenFetch } from "@elysiajs/eden";
import type { InternalAPI } from "../../../routes/api/[...slugs]/+server";
import { PUBLIC_DOMAIN } from "$env/static/public"

export const fetch = edenFetch<InternalAPI>(PUBLIC_DOMAIN);
