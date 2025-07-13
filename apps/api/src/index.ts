import { sharedFunction } from "@framink/shared";

const server = Bun.serve({
	port: 3001,
	fetch(request) {
		const url = new URL(request.url);

		if (url.pathname === "/") {
			return new Response("Framink API");
		}

		if (url.pathname === "/health") {
			return new Response(JSON.stringify({ status: "ok", shared: sharedFunction() }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`API server running on http://localhost:${server.port}`);
