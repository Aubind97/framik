import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function createCipher(secret: string, purpose: string) {
	const key = Buffer.from(hkdfSync("sha256", secret, "", purpose, 32));

	return {
		encrypt(plaintext: string) {
			const iv = randomBytes(IV_LENGTH);
			const cipher = createCipheriv(ALGORITHM, key, iv);
			const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
			return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
		},
		decrypt(payload: string) {
			const data = Buffer.from(payload, "base64");
			const decipher = createDecipheriv(ALGORITHM, key, data.subarray(0, IV_LENGTH));
			decipher.setAuthTag(data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
			return Buffer.concat([decipher.update(data.subarray(IV_LENGTH + TAG_LENGTH)), decipher.final()]).toString("utf8");
		},
	};
}
