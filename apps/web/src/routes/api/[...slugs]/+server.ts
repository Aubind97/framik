import { Elysia, t } from 'elysia';
import { authRoutes } from '$lib/api/routes/auth.ts'

const app = new Elysia({ prefix: '/api' })
    .use(authRoutes)

type RequestHandler = (v: { request: Request }) => Response | Promise<Response>

export const GET: RequestHandler = ({ request }) => app.handle(request)
export const POST: RequestHandler = ({ request }) => app.handle(request)
