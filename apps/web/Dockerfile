# Build context is the repository root: docker build -f apps/web/Dockerfile .
# Vite needs Node (module.findPackageJSON); bun runs installs and turbo
FROM node:24-slim AS build
COPY --from=oven/bun:1.4.4 /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile --ignore-scripts --filter ./apps/web
# SvelteKit validates env vars while building; these placeholders are not inlined, real values come at runtime
RUN PUBLIC_DOMAIN=http://localhost DATABASE_URL=file:/tmp/build.db BETTER_AUTH_SECRET=build \
	bunx turbo build --filter=@framik/web --env-mode=loose
RUN bun build apps/web/scripts/migrate.ts --target bun --external @libsql/client --outfile apps/web/build/migrate.js

# Only native runtime deps (libsql, sharp) remain: devDependencies are bundled into the build by adapter-node.
# Installed on Alpine so they get their musl binaries.
FROM oven/bun:1.4.4-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/daemon/package.json apps/daemon/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --production --omit=peer --ignore-scripts

FROM oven/bun:1.4.4-alpine
ENV NODE_ENV=production \
	PORT=3000 \
	DATABASE_URL=file:/data/framik.db
WORKDIR /app
COPY --from=deps /app ./
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/web/build apps/web/build
COPY apps/web/drizzle apps/web/drizzle
WORKDIR /app/apps/web
VOLUME /data
EXPOSE 3000
CMD ["sh", "-c", "export ORIGIN=\"${ORIGIN:-$PUBLIC_DOMAIN}\" BETTER_AUTH_URL=\"${BETTER_AUTH_URL:-$PUBLIC_DOMAIN}\" && bun build/migrate.js && exec bun build/index.js"]
