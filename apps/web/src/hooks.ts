import type { Reroute } from "@sveltejs/kit";

const rerouteTable: Record<string, string> = {
	"/": "/app",
};

export const reroute: Reroute = ({ url }) => {
	if (url.pathname in rerouteTable) {
		return rerouteTable[url.pathname];
	}
};
