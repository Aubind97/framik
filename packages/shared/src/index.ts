export const sharedFunction = () => {
	return "Hello from shared package!";
};

export type Color = { r: number; g: number; b: number };

export const COLOR_PALETTE_6 = [
	{ r: 255, g: 0, b: 0 }, // Red
	{ r: 0, g: 255, b: 0 }, // Green
	{ r: 0, g: 0, b: 255 }, // Blue
	{ r: 0, g: 0, b: 0 }, // Black
	{ r: 255, g: 255, b: 255 }, // White
] satisfies Color[];

export const findClosestPaletteColor = (color: Color, palette: Color[]): Color => {
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
};
