import { Elysia } from "elysia";
import { frameRoutes } from "$lib/api/routes/frame.ts";

const app = new Elysia({ prefix: "/api" }).use(frameRoutes);

type RequestHandler = (v: { request: Request }) => Response | Promise<Response>;

export const GET: RequestHandler = ({ request }) => app.handle(request);
export const POST: RequestHandler = ({ request }) => app.handle(request);
