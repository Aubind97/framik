export type Color = { r: number; g: number; b: number };

type ImageData = {
	data: Uint8ClampedArray;
	width: number;
	height: number;
};

type ColorArray = [number, number, number];

interface DitherOptions {
	colorDistance: (color1: ColorArray, color2: Color) => number;
}

export function applyDithering(imageData: ImageData, colors: Color[]): ImageData {
	const { data, width, height } = imageData;

	const quantize = atkinsonDither(new Uint8ClampedArray(data), colors, 1, height, width, { colorDistance: euclideanColorDistance });

	return {
		data: quantize,
		width,
		height,
	};
}

/**
 * Finds the color in the palette that has the minimum distance to the target color
 */
function approximateColor(color: ColorArray, palette: Color[], colorDistance: (color1: ColorArray, color2: Color) => number): ColorArray {
	const findIndex = (distanceFn: typeof colorDistance, targetColor: ColorArray, remainingColors: Color[], currentBest: Color): Color => {
		if (remainingColors.length === 2) {
			const distance1 = distanceFn(targetColor, currentBest);
			const distance2 = distanceFn(targetColor, remainingColors[1]);
			return distance1 <= distance2 ? currentBest : remainingColors[1];
		}

		const tail = remainingColors.slice(1);
		const nextBest = distanceFn(targetColor, currentBest) <= distanceFn(targetColor, remainingColors[1]) ? currentBest : remainingColors[1];

		return findIndex(distanceFn, targetColor, tail, nextBest);
	};

	const foundColor = findIndex(colorDistance, color, palette, palette[0]);
	return [foundColor.r, foundColor.g, foundColor.b];
}

/**
 * Applies Atkinson dithering algorithm to image data
 */
function atkinsonDither(uint8data: Uint8ClampedArray, palette: Color[], step: number, height: number, width: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Uint8ClampedArray(uint8data);
	const output = new Uint8ClampedArray(uint8data);
	const errorRatio = 1 / 8;

	// Helper function to calculate pixel index
	const getPixelIndex = (x: number, y: number): number => {
		return 4 * x + 4 * y * width;
	};

	// Helper function to safely apply error diffusion
	const applyError = (x: number, y: number, channelOffset: number, error: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y) + channelOffset;
			imageData[index] = Math.max(0, Math.min(255, imageData[index] + errorRatio * error));
		}
	};

	for (let y = 0; y < height; y += step) {
		for (let x = 0; x < width; x += step) {
			const pixelIndex = getPixelIndex(x, y);

			// Extract RGB values
			const currentColor: ColorArray = [
				imageData[pixelIndex], // R
				imageData[pixelIndex + 1], // G
				imageData[pixelIndex + 2], // B
			];

			// Find the closest color in the palette using the pure function
			const approximatedColor = approximateColor(currentColor, palette, options.colorDistance);

			// Calculate quantization error for each channel
			const error: Color = {
				r: currentColor[0] - approximatedColor[0],
				g: currentColor[1] - approximatedColor[1],
				b: currentColor[2] - approximatedColor[2],
			};

			// Define Atkinson dithering pattern offsets
			const errorOffsets = [
				{ x: step, y: 0 }, // Right
				{ x: 2 * step, y: 0 }, // Right + 1
				{ x: -step, y: step }, // Bottom left
				{ x: 0, y: step }, // Bottom
				{ x: step, y: step }, // Bottom right
				{ x: 0, y: 2 * step }, // Bottom + 1
			];

			// Distribute quantization error to neighboring pixels
			for (const offset of errorOffsets) {
				const newX = x + offset.x;
				const newY = y + offset.y;

				applyError(newX, newY, 0, error.r); // Red channel
				applyError(newX, newY, 1, error.g); // Green channel
				applyError(newX, newY, 2, error.b); // Blue channel
			}

			// Fill the current block with the approximated color
			for (let dx = 0; dx < step; dx++) {
				for (let dy = 0; dy < step; dy++) {
					if (x + dx < width && y + dy < height) {
						const blockPixelIndex = pixelIndex + 4 * dx + 4 * width * dy;

						output[blockPixelIndex] = approximatedColor[0]; // R
						output[blockPixelIndex + 1] = approximatedColor[1]; // G
						output[blockPixelIndex + 2] = approximatedColor[2]; // B
						// Alpha channel remains unchanged
					}
				}
			}
		}
	}

	return output;
}

// Example usage with a typical Euclidean color distance function
function euclideanColorDistance(color1: ColorArray, color2: Color): number {
	const dr = color1[0] - color2.r;
	const dg = color1[1] - color2.g;
	const db = color1[2] - color2.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
}
