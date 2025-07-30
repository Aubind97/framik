export type Color = { r: number; g: number; b: number };

type ImageData = {
	data: Uint8ClampedArray;
	width: number;
	height: number;
};

type ColorArray = [number, number, number];

interface DitherOptions {
	colorDistance: (color1: ColorArray, color2: Color) => number;
	algorithm?: "atkinson" | "floyd-steinberg" | "sierra" | "sierra-two-row";
	serpentine?: boolean; // Zigzag scanning for better distribution
	gamma?: number; // Gamma correction for e-ink
}

export function applyDithering(imageData: ImageData, colors: Color[], options?: Partial<DitherOptions>): ImageData {
	const { data, width, height } = imageData;

	const opts = {
		colorDistance: manhattanColorDistance,
		algorithm: "atkinson", // Better for e-ink than Atkinson
		serpentine: true,
		gamma: 1,
		...options,
	} satisfies DitherOptions;

	// Apply gamma correction for better e-ink perception
	const gammaCorrectedData = applyGammaCorrection(new Uint8ClampedArray(data), opts.gamma);

	let quantizedData: Uint8ClampedArray;

	switch (opts.algorithm) {
		case "floyd-steinberg":
			quantizedData = floydSteinbergDither(gammaCorrectedData, colors, width, height, opts);
			break;
		case "sierra":
			quantizedData = sierraDither(gammaCorrectedData, colors, width, height, opts);
			break;
		case "sierra-two-row":
			quantizedData = sierraTwoRowDither(gammaCorrectedData, colors, width, height, opts);
			break;
		default:
			quantizedData = atkinsonDither(gammaCorrectedData, colors, 1, height, width, opts);
			break;
	}

	return {
		data: quantizedData,
		width,
		height,
	};
}

/**
 * Sierra Two-Row dithering - lighter version of Sierra, good for e-ink
 * Uses only 2 rows instead of 3, making it faster while still high quality
 */
function sierraTwoRowDither(uint8data: Uint8ClampedArray, palette: Color[], width: number, height: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Float32Array(uint8data.length);
	const output = new Uint8ClampedArray(uint8data);
	const { findClosestColor } = createColorLookup(palette);

	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const distributeError = (x: number, y: number, error: [number, number, number], factor: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y);
			imageData[index] += error[0] * factor;
			imageData[index + 1] += error[1] * factor;
			imageData[index + 2] += error[2] * factor;
		}
	};

	for (let y = 0; y < height; y++) {
		const reverse = options.serpentine && y % 2 === 1;
		const startX = reverse ? width - 1 : 0;
		const endX = reverse ? -1 : width;
		const stepX = reverse ? -1 : 1;

		for (let x = startX; x !== endX; x += stepX) {
			const pixelIndex = getPixelIndex(x, y);

			const currentColor: ColorArray = [
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex]))),
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex + 1]))),
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex + 2]))),
			];

			const approximatedColor = findClosestColor(currentColor, options.colorDistance);

			const error: [number, number, number] = [currentColor[0] - approximatedColor[0], currentColor[1] - approximatedColor[1], currentColor[2] - approximatedColor[2]];

			// Sierra Two-Row error distribution pattern (16 total, only 2 rows)
			if (reverse) {
				distributeError(x - 1, y, error, 4 / 16); // Left
				distributeError(x - 2, y, error, 2 / 16); // Left-2
				distributeError(x - 2, y + 1, error, 1 / 16); // Bottom-left-2
				distributeError(x - 1, y + 1, error, 2 / 16); // Bottom-left
				distributeError(x, y + 1, error, 3 / 16); // Bottom
				distributeError(x + 1, y + 1, error, 2 / 16); // Bottom-right
				distributeError(x + 2, y + 1, error, 1 / 16); // Bottom-right-2
			} else {
				distributeError(x + 1, y, error, 4 / 16); // Right
				distributeError(x + 2, y, error, 2 / 16); // Right-2
				distributeError(x - 2, y + 1, error, 1 / 16); // Bottom-left-2
				distributeError(x - 1, y + 1, error, 2 / 16); // Bottom-left
				distributeError(x, y + 1, error, 3 / 16); // Bottom
				distributeError(x + 1, y + 1, error, 2 / 16); // Bottom-right
				distributeError(x + 2, y + 1, error, 1 / 16); // Bottom-right-2
			}

			output[pixelIndex] = approximatedColor[0];
			output[pixelIndex + 1] = approximatedColor[1];
			output[pixelIndex + 2] = approximatedColor[2];
		}
	}

	return output;
}

/**
 * Apply gamma correction optimized for e-ink displays
 */
function applyGammaCorrection(data: Uint8ClampedArray, gamma: number): Uint8ClampedArray {
	const corrected = new Uint8ClampedArray(data);
	const invGamma = 1.0 / gamma;

	// Pre-compute lookup table for performance
	const gammaLUT = new Uint8Array(256);
	for (let i = 0; i < 256; i++) {
		gammaLUT[i] = Math.round(255 * (i / 255) ** invGamma);
	}

	for (let i = 0; i < data.length; i += 4) {
		corrected[i] = gammaLUT[data[i]]; // R
		corrected[i + 1] = gammaLUT[data[i + 1]]; // G
		corrected[i + 2] = gammaLUT[data[i + 2]]; // B
		// Alpha remains unchanged
	}

	return corrected;
}

/**
 * Pre-compute color palette for faster lookups
 */
function createColorLookup(palette: Color[]): {
	findClosestColor: (color: ColorArray, colorDistance: (c1: ColorArray, c2: Color) => number) => ColorArray;
} {
	// For small palettes (typical for e-ink), linear search is fine
	// For larger palettes, consider k-d tree or other spatial data structures

	const findClosestColor = (color: ColorArray, colorDistance: (c1: ColorArray, c2: Color) => number): ColorArray => {
		let minDistance = Infinity;
		let closestColor = palette[0];

		for (const paletteColor of palette) {
			const distance = colorDistance(color, paletteColor);
			if (distance < minDistance) {
				minDistance = distance;
				closestColor = paletteColor;
			}
		}

		return [closestColor.r, closestColor.g, closestColor.b];
	};

	return { findClosestColor };
}

/**
 * Floyd-Steinberg dithering - often better for e-ink than Atkinson
 * Distributes error more evenly
 */
function floydSteinbergDither(uint8data: Uint8ClampedArray, palette: Color[], width: number, height: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Float32Array(uint8data.length);
	const output = new Uint8ClampedArray(uint8data);
	const { findClosestColor } = createColorLookup(palette);

	// Convert to float for better error accumulation
	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const distributeError = (x: number, y: number, error: [number, number, number], factor: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y);
			imageData[index] += error[0] * factor;
			imageData[index + 1] += error[1] * factor;
			imageData[index + 2] += error[2] * factor;
		}
	};

	for (let y = 0; y < height; y++) {
		const reverse = options.serpentine && y % 2 === 1;
		const startX = reverse ? width - 1 : 0;
		const endX = reverse ? -1 : width;
		const stepX = reverse ? -1 : 1;

		for (let x = startX; x !== endX; x += stepX) {
			const pixelIndex = getPixelIndex(x, y);

			// Clamp values to valid range
			const currentColor: ColorArray = [
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex]))),
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex + 1]))),
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex + 2]))),
			];

			const approximatedColor = findClosestColor(currentColor, options.colorDistance);

			const error: [number, number, number] = [currentColor[0] - approximatedColor[0], currentColor[1] - approximatedColor[1], currentColor[2] - approximatedColor[2]];

			// Floyd-Steinberg error distribution pattern
			if (reverse) {
				distributeError(x - 1, y, error, 7 / 16); // Left
				distributeError(x - 1, y + 1, error, 3 / 16); // Bottom-left
				distributeError(x, y + 1, error, 5 / 16); // Bottom
				distributeError(x + 1, y + 1, error, 1 / 16); // Bottom-right
			} else {
				distributeError(x + 1, y, error, 7 / 16); // Right
				distributeError(x - 1, y + 1, error, 3 / 16); // Bottom-left
				distributeError(x, y + 1, error, 5 / 16); // Bottom
				distributeError(x + 1, y + 1, error, 1 / 16); // Bottom-right
			}

			// Set output pixel
			output[pixelIndex] = approximatedColor[0];
			output[pixelIndex + 1] = approximatedColor[1];
			output[pixelIndex + 2] = approximatedColor[2];
		}
	}

	return output;
}

/**
 * Sierra dithering - good balance between quality and performance
 */
function sierraDither(uint8data: Uint8ClampedArray, palette: Color[], width: number, height: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Float32Array(uint8data.length);
	const output = new Uint8ClampedArray(uint8data);
	const { findClosestColor } = createColorLookup(palette);

	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const distributeError = (x: number, y: number, error: [number, number, number], factor: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y);
			imageData[index] += error[0] * factor;
			imageData[index + 1] += error[1] * factor;
			imageData[index + 2] += error[2] * factor;
		}
	};

	for (let y = 0; y < height; y++) {
		const reverse = options.serpentine && y % 2 === 1;
		const startX = reverse ? width - 1 : 0;
		const endX = reverse ? -1 : width;
		const stepX = reverse ? -1 : 1;

		for (let x = startX; x !== endX; x += stepX) {
			const pixelIndex = getPixelIndex(x, y);

			const currentColor: ColorArray = [
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex]))),
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex + 1]))),
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex + 2]))),
			];

			const approximatedColor = findClosestColor(currentColor, options.colorDistance);

			const error: [number, number, number] = [currentColor[0] - approximatedColor[0], currentColor[1] - approximatedColor[1], currentColor[2] - approximatedColor[2]];

			// Sierra error distribution pattern (32 total)
			if (reverse) {
				distributeError(x - 1, y, error, 5 / 32);
				distributeError(x - 2, y, error, 3 / 32);
				distributeError(x - 2, y + 1, error, 2 / 32);
				distributeError(x - 1, y + 1, error, 4 / 32);
				distributeError(x, y + 1, error, 5 / 32);
				distributeError(x + 1, y + 1, error, 4 / 32);
				distributeError(x + 2, y + 1, error, 2 / 32);
				distributeError(x - 1, y + 2, error, 2 / 32);
				distributeError(x, y + 2, error, 3 / 32);
				distributeError(x + 1, y + 2, error, 2 / 32);
			} else {
				distributeError(x + 1, y, error, 5 / 32);
				distributeError(x + 2, y, error, 3 / 32);
				distributeError(x - 2, y + 1, error, 2 / 32);
				distributeError(x - 1, y + 1, error, 4 / 32);
				distributeError(x, y + 1, error, 5 / 32);
				distributeError(x + 1, y + 1, error, 4 / 32);
				distributeError(x + 2, y + 1, error, 2 / 32);
				distributeError(x - 1, y + 2, error, 2 / 32);
				distributeError(x, y + 2, error, 3 / 32);
				distributeError(x + 1, y + 2, error, 2 / 32);
			}

			output[pixelIndex] = approximatedColor[0];
			output[pixelIndex + 1] = approximatedColor[1];
			output[pixelIndex + 2] = approximatedColor[2];
		}
	}

	return output;
}

/**
 * Improved Atkinson dithering with better error distribution
 */
function atkinsonDither(uint8data: Uint8ClampedArray, palette: Color[], step: number, height: number, width: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Float32Array(uint8data.length);
	const output = new Uint8ClampedArray(uint8data);
	const { findClosestColor } = createColorLookup(palette);

	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const applyError = (x: number, y: number, channelOffset: number, error: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y) + channelOffset;
			imageData[index] += error / 8; // Atkinson uses 1/8 error distribution
		}
	};

	for (let y = 0; y < height; y += step) {
		for (let x = 0; x < width; x += step) {
			const pixelIndex = getPixelIndex(x, y);

			const currentColor: ColorArray = [
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex]))),
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex + 1]))),
				Math.max(0, Math.min(255, Math.round(imageData[pixelIndex + 2]))),
			];

			const approximatedColor = findClosestColor(currentColor, options.colorDistance);

			const error = {
				r: currentColor[0] - approximatedColor[0],
				g: currentColor[1] - approximatedColor[1],
				b: currentColor[2] - approximatedColor[2],
			};

			const errorOffsets = [
				{ x: step, y: 0 },
				{ x: 2 * step, y: 0 },
				{ x: -step, y: step },
				{ x: 0, y: step },
				{ x: step, y: step },
				{ x: 0, y: 2 * step },
			];

			for (const offset of errorOffsets) {
				const newX = x + offset.x;
				const newY = y + offset.y;

				applyError(newX, newY, 0, error.r);
				applyError(newX, newY, 1, error.g);
				applyError(newX, newY, 2, error.b);
			}

			for (let dx = 0; dx < step; dx++) {
				for (let dy = 0; dy < step; dy++) {
					if (x + dx < width && y + dy < height) {
						const blockPixelIndex = getPixelIndex(x + dx, y + dy);
						output[blockPixelIndex] = approximatedColor[0];
						output[blockPixelIndex + 1] = approximatedColor[1];
						output[blockPixelIndex + 2] = approximatedColor[2];
					}
				}
			}
		}
	}

	return output;
}

// function euclideanColorDistance(color1: ColorArray, color2: Color): number {
// 	const dr = color1[0] - color2.r;
// 	const dg = color1[1] - color2.g;
// 	const db = color1[2] - color2.b;
// 	return Math.sqrt(dr * dr + dg * dg + db * db);
// }

function manhattanColorDistance(color1: ColorArray, color2: Color): number {
	return Math.abs(color1[0] - color2.r) + Math.abs(color1[1] - color2.g) + Math.abs(color1[2] - color2.b);
}
