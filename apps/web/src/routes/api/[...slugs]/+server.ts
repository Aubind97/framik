import { Elysia } from "elysia";
import { daemonRoutes } from "$lib/api/routes/daemon";
import { frameRoutes } from "$lib/api/routes/frame.ts";
import { generatorRouter } from "$lib/api/routes/generator";

const app = new Elysia({ prefix: "/api" }).use(frameRoutes).use(daemonRoutes).use(generatorRouter);

type RequestHandler = (v: { request: Request }) => Response | Promise<Response>;

export const GET: RequestHandler = ({ request }) => app.handle(request);
export const POST: RequestHandler = ({ request }) => app.handle(request);

export type InternalAPI = typeof app;
