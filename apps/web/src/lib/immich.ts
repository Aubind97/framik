export type ImmichHeader = { name: string; value: string };

const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const RESERVED_HEADERS = new Set(["x-api-key", "host", "content-length", "connection", "transfer-encoding"]);

export function isAllowedHeaderName(name: string) {
	return HEADER_NAME.test(name) && !RESERVED_HEADERS.has(name.toLowerCase());
}

/** Accepts the server URL the way the Immich app does, with or without a trailing `/api`. */
export function normalizeImmichUrl(url: string) {
	return url
		.trim()
		.replace(/\/+$/, "")
		.replace(/\/api$/, "");
}
