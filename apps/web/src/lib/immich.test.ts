import { describe, expect, test } from "bun:test";
import { formatTimeBucket, isAllowedHeaderName, matchesSearch, normalizeImmichUrl } from "./immich.ts";

describe("matchesSearch", () => {
	test("ignores case, accents and surrounding spaces", () => {
		expect(matchesSearch("Anniversaire de mariage", "MARIAGE")).toBe(true);
		expect(matchesSearch("Été 2025", "ete")).toBe(true);
		expect(matchesSearch("Noël", " noel ")).toBe(true);
		expect(matchesSearch("Holidays", "")).toBe(true);
	});

	test("rejects non-matching text", () => {
		expect(matchesSearch("Holidays", "family")).toBe(false);
	});
});

describe("formatTimeBucket", () => {
	test("formats the month and year regardless of the local time zone", () => {
		expect(formatTimeBucket("2024-03-01", "en-US")).toBe("March 2024");
		expect(formatTimeBucket("2024-01-01T00:00:00.000Z", "en-US")).toBe("January 2024");
		expect(formatTimeBucket("2023-12-01", "fr-FR")).toBe("décembre 2023");
	});
});

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
