import { Elysia } from "elysia";
import { daemonRoutes } from "#lib/api/routes/daemon.ts";
import { frameRoutes } from "#lib/api/routes/frame.ts";

const app = new Elysia({ prefix: "/api" }).use(frameRoutes).use(daemonRoutes);

type RequestHandler = (v: { request: Request }) => Response | Promise<Response>;

export const GET: RequestHandler = ({ request }) => app.handle(request);
export const POST: RequestHandler = ({ request }) => app.handle(request);
export const DELETE: RequestHandler = ({ request }) => app.handle(request);

export type InternalAPI = typeof app;
