type Color = { r: number; g: number; b: number };

const COLOR_PALETTE_6 = [
	{ r: 255, g: 0, b: 0 }, // Red
	{ r: 0, g: 255, b: 0 }, // Green
	{ r: 0, g: 0, b: 255 }, // Blue
	{ r: 0, g: 0, b: 0 }, // Black
	{ r: 255, g: 255, b: 255 }, // White
] satisfies Color[];

function distributeError(data: Uint8ClampedArray, x: number, y: number, width: number, height: number, errR: number, errG: number, errB: number, factor: number) {
	if (x >= 0 && x < width && y >= 0 && y < height) {
		const index = (y * width + x) * 4;
		const r = data[index];
		const g = data[index + 1];
		const b = data[index + 2];

		if (r !== undefined && g !== undefined && b !== undefined) {
			data[index] = Math.min(255, Math.max(0, r + errR * factor));
			data[index + 1] = Math.min(255, Math.max(0, g + errG * factor));
			data[index + 2] = Math.min(255, Math.max(0, b + errB * factor));
		}
	}
}

export function applyFloydSteinbergDithering(imageData: { data: Uint8ClampedArray; width: number; height: number }): { data: Uint8ClampedArray; width: number; height: number } {
	const data = imageData.data;
	const width = imageData.width;
	const height = imageData.height;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 4;
			const r = data[index];
			const g = data[index + 1];
			const b = data[index + 2];

			if (r === undefined || g === undefined || b === undefined) {
				continue;
			}

			const oldColor: Color = {
				r,
				g,
				b,
			};
			const newColor = findClosestPaletteColor(oldColor, COLOR_PALETTE_6);
			data[index] = newColor.r;
			data[index + 1] = newColor.g;
			data[index + 2] = newColor.b;

			const errR = oldColor.r - newColor.r;
			const errG = oldColor.g - newColor.g;
			const errB = oldColor.b - newColor.b;

			distributeError(data, x + 1, y, width, height, errR, errG, errB, 7 / 16);
			distributeError(data, x - 1, y + 1, width, height, errR, errG, errB, 3 / 16);
			distributeError(data, x, y + 1, width, height, errR, errG, errB, 5 / 16);
			distributeError(data, x + 1, y + 1, width, height, errR, errG, errB, 1 / 16);
		}
	}

	return imageData;
}

export function findClosestPaletteColor(color: Color, palette: Color[]): Color {
	if (palette.length === 0) {
		throw new Error("Palette is empty. Cannot determine the closest color.");
	}

	const firstColor = palette[0];
	if (!firstColor) {
		throw new Error("Invalid palette color.");
	}

	let closestColor = firstColor;
	let minDistance = Number.MAX_VALUE;

	for (const paletteColor of palette) {
		const distance = Math.sqrt((color.r - paletteColor.r) ** 2 + (color.g - paletteColor.g) ** 2 + (color.b - paletteColor.b) ** 2);

		if (distance < minDistance) {
			closestColor = paletteColor;
			minDistance = distance;
		}
	}

	return closestColor;
}
