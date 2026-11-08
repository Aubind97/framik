export type ImmichHeader = { name: string; value: string };

export const IMMICH_API_KEY_PERMISSIONS = [
	{ name: "user.read", usage: "Test the connection" },
	{ name: "asset.read", usage: "List your photos by month" },
	{ name: "asset.view", usage: "Show thumbnails and previews" },
	{ name: "album.read", usage: "List your albums and the ones shared with you" },
] as const;

const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const RESERVED_HEADERS = new Set(["x-api-key", "host", "content-length", "connection", "transfer-encoding"]);

export function isAllowedHeaderName(name: string) {
	return HEADER_NAME.test(name) && !RESERVED_HEADERS.has(name.toLowerCase());
}

/** `timeBucket` is the first day of the month, e.g. `2024-03-01` or `2024-03-01T00:00:00.000Z`. */
export function formatTimeBucket(timeBucket: string, locale?: string) {
	const [year, month] = timeBucket.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Accepts the server URL the way the Immich app does, with or without a trailing `/api`. */
export function normalizeImmichUrl(url: string) {
	return url
		.trim()
		.replace(/\/+$/, "")
		.replace(/\/api$/, "");
}
