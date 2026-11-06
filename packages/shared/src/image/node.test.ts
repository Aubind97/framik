import { expect, test } from "bun:test";
import sharp from "sharp";
import { EPAPER_PALETTE } from "./dithering";
import { applyDitheringNode } from "./node";

test("node dithering only emits colours the driver maps exactly", async () => {
	const width = 64;
	const height = 32;
	const raw = Buffer.alloc(width * height * 3);
	for (let i = 0; i < width * height; i++) {
		raw[i * 3] = (i * 7) % 256;
		raw[i * 3 + 1] = (i * 13) % 256;
		raw[i * 3 + 2] = (i * 29) % 256;
	}
	const input = (
		await sharp(raw, { raw: { width, height, channels: 3 } })
			.png()
			.toBuffer()
	).toString("base64");

	const output = Buffer.from(await applyDitheringNode(input), "base64");
	const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });

	const pure = new Set(EPAPER_PALETTE.map(({ pure: c }) => `${c.r},${c.g},${c.b}`));
	for (let i = 0; i < data.length; i += info.channels) {
		expect(pure.has(`${data[i]},${data[i + 1]},${data[i + 2]}`)).toBe(true);
	}
});
