import { describe, expect, test } from "bun:test";
import { isAllowedHeaderName, normalizeImmichUrl } from "./immich.ts";

describe("isAllowedHeaderName", () => {
	test("accepts custom proxy headers", () => {
		expect(isAllowedHeaderName("P-Access-Token-Id")).toBe(true);
		expect(isAllowedHeaderName("CF-Access-Client-Secret")).toBe(true);
	});

	test("rejects invalid or reserved names", () => {
		expect(isAllowedHeaderName("")).toBe(false);
		expect(isAllowedHeaderName("bad header")).toBe(false);
		expect(isAllowedHeaderName("X-Api-Key")).toBe(false);
		expect(isAllowedHeaderName("Host")).toBe(false);
	});
});

describe("normalizeImmichUrl", () => {
	test("strips trailing slashes and /api", () => {
		expect(normalizeImmichUrl(" https://photos.example.com/ ")).toBe("https://photos.example.com");
		expect(normalizeImmichUrl("https://photos.example.com/api/")).toBe("https://photos.example.com");
		expect(normalizeImmichUrl("https://example.com/immich/api")).toBe("https://example.com/immich");
	});
});
