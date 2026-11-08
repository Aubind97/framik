import { describe, expect, test } from "bun:test";
import { createCipher } from "./crypto.ts";

describe("createCipher", () => {
	const cipher = createCipher("test-secret", "test");

	test("decrypts what it encrypts", () => {
		const plaintext = JSON.stringify({ apiKey: "abc", headers: [{ name: "x-token", value: "é🔑" }] });
		expect(cipher.decrypt(cipher.encrypt(plaintext))).toBe(plaintext);
	});

	test("uses a fresh IV for every encryption", () => {
		expect(cipher.encrypt("same")).not.toBe(cipher.encrypt("same"));
	});

	test("rejects tampered payloads", () => {
		const payload = Buffer.from(cipher.encrypt("secret"), "base64");
		payload[payload.length - 1] ^= 1;
		expect(() => cipher.decrypt(payload.toString("base64"))).toThrow();
	});

	test("rejects payloads from another secret or purpose", () => {
		const payload = cipher.encrypt("secret");
		expect(() => createCipher("other-secret", "test").decrypt(payload)).toThrow();
		expect(() => createCipher("test-secret", "other").decrypt(payload)).toThrow();
	});
});
