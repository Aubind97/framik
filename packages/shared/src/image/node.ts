import { applyFloydSteinbergDithering } from "./dithering";

// Node.js-compatible function (requires sharp package)
export async function applyFloydSteinbergDitheringNode(base64Image: string): Promise<string> {
	try {
		// Dynamic import to avoid issues when sharp is not available
		const sharp = (await import("sharp")).default;

		// Remove data URL prefix if present
		const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
		const buffer = Buffer.from(base64Data, "base64");

		const image = sharp(buffer);
		const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

		// Convert to RGBA format
		const rgba = new Uint8ClampedArray(info.width * info.height * 4);
		for (let i = 0; i < info.width * info.height; i++) {
			const srcIdx = i * info.channels;
			const dstIdx = i * 4;
			rgba[dstIdx] = data[srcIdx]; // R
			rgba[dstIdx + 1] = data[srcIdx + 1]; // G
			rgba[dstIdx + 2] = data[srcIdx + 2]; // B
			rgba[dstIdx + 3] = info.channels === 4 ? data[srcIdx + 3] : 255; // A
		}

		const imageData = { data: rgba, width: info.width, height: info.height };
		const dithered = applyFloydSteinbergDithering(imageData);

		// Convert back to RGB and create PNG
		const rgbData = Buffer.alloc(info.width * info.height * 3);
		for (let i = 0; i < info.width * info.height; i++) {
			const srcIdx = i * 4;
			const dstIdx = i * 3;
			rgbData[dstIdx] = dithered.data[srcIdx]; // R
			rgbData[dstIdx + 1] = dithered.data[srcIdx + 1]; // G
			rgbData[dstIdx + 2] = dithered.data[srcIdx + 2]; // B
		}

		const outputBuffer = await sharp(rgbData, {
			raw: { width: info.width, height: info.height, channels: 3 },
		})
			.png()
			.toBuffer();

		return `${outputBuffer.toString("base64")}`;
	} catch (error) {
		throw new Error(`Sharp processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}
