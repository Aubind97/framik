import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

await migrate(drizzle(createClient({ url })), { migrationsFolder: "drizzle" });
console.log("Database migrations applied");
