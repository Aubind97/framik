import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { DATABASE_URL } from "$app/env/private";
import * as schema from "./schema";

const client = createClient({ url: DATABASE_URL });

export const db = drizzle(client, { schema });
