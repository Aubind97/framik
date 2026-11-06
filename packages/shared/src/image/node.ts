import { applyDithering, type DitherOptions, EPAPER_MEASURED_COLORS, EPAPER_PALETTE } from "./dithering";

const key = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;
const MEASURED_TO_PURE = new Map(EPAPER_PALETTE.map(({ measured: m, pure }) => [key(m.r, m.g, m.b), pure]));

// Node.js-compatible function (requires sharp package)
export async function applyDitheringNode(base64Image: string, options?: Partial<Pick<DitherOptions, "algorithm" | "gamma">>): Promise<string> {
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
		const dithered = applyDithering(imageData, EPAPER_MEASURED_COLORS, options);

		// Convert back to RGB and create PNG
		const rgbData = Buffer.alloc(info.width * info.height * 3);
		for (let i = 0; i < info.width * info.height; i++) {
			const srcIdx = i * 4;
			const dstIdx = i * 3;
			// biome-ignore lint/style/noNonNullAssertion: dithered pixels are always palette colours
			const pure = MEASURED_TO_PURE.get(key(dithered.data[srcIdx], dithered.data[srcIdx + 1], dithered.data[srcIdx + 2]))!;
			rgbData[dstIdx] = pure.r;
			rgbData[dstIdx + 1] = pure.g;
			rgbData[dstIdx + 2] = pure.b;
		}

		const outputBuffer = await sharp(rgbData, {
			raw: { width: info.width, height: info.height, channels: 3 },
		})
			.png()
			.toBuffer();

		return outputBuffer.toString("base64");
	} catch (error) {
		throw new Error(`Sharp processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

const PURE_TO_MEASURED = new Map(EPAPER_PALETTE.map(({ measured, pure: p }) => [key(p.r, p.g, p.b), measured]));

// The frame stores pure driver colours; map them back to what the panel actually shows
export async function toMeasuredColorsNode(base64Image: string): Promise<string> {
	const sharp = (await import("sharp")).default;
	const buffer = Buffer.from(base64Image.replace(/^data:image\/[a-z]+;base64,/, ""), "base64");
	const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });

	for (let i = 0; i < data.length; i += 3) {
		const measured = PURE_TO_MEASURED.get(key(data[i], data[i + 1], data[i + 2]));
		if (!measured) continue;
		data[i] = measured.r;
		data[i + 1] = measured.g;
		data[i + 2] = measured.b;
	}

	return (
		await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
			.png()
			.toBuffer()
	).toString("base64");
}
