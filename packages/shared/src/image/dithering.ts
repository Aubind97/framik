/**
 * Advanced Dithering Library for E-ink Displays
 *
 * This library provides high-quality dithering algorithms optimized for e-ink displays,
 * with support for perceptual color matching, adaptive contrast enhancement, and
 * palette optimization.
 *
 * Key improvements over basic dithering:
 * - Perceptually accurate color distance calculations (LAB color space, Delta E)
 * - Error clamping to prevent overflow artifacts
 * - Local contrast enhancement for better detail preservation
 * - Adaptive palette optimization using k-means clustering
 * - Multiple high-quality algorithms (Stucki, Sierra, Floyd-Steinberg)
 * - Serpentine scanning for better error distribution
 */

export type Color = { r: number; g: number; b: number };

type ImageData = {
	data: Uint8ClampedArray;
	width: number;
	height: number;
};

type ColorArray = [number, number, number];

export interface DitherOptions {
	/** Color distance function - perceptualColorDistance recommended for best quality */
	colorDistance: (color1: ColorArray, color2: Color) => number;
	/** Dithering algorithm - 'stucki' recommended for e-ink displays */
	algorithm?: "atkinson" | "floyd-steinberg" | "sierra" | "sierra-two-row" | "stucki";
	/** Zigzag scanning for better error distribution - recommended: true */
	serpentine?: boolean;
	/** Gamma correction for e-ink displays - typically 1.0 for e-ink */
	gamma?: number;
	/** Use LAB color space for perceptually accurate color matching */
	usePerceptualSpace?: boolean;
	/** Clamp error distribution to prevent overflow artifacts - recommended: true */
	errorClamping?: boolean;
	/** Enhance local contrast before dithering (0-1) - subtle enhancement recommended: 0.1-0.3 */
	contrastEnhancement?: number;
	/** Automatically optimize palette based on image content using k-means clustering */
	optimizePalette?: boolean;
}

/**
 * Optimize color palette based on image content using k-means clustering
 */
export function optimizePalette(imageData: ImageData, targetColors: number = 4, maxIterations: number = 20): Color[] {
	const { data, width, height } = imageData;
	const pixels: ColorArray[] = [];

	// Sample pixels (use every nth pixel for performance)
	const sampleRate = Math.max(1, Math.floor((width * height) / 10000));

	for (let i = 0; i < data.length; i += 4 * sampleRate) {
		pixels.push([data[i], data[i + 1], data[i + 2]]);
	}

	// Initialize centroids using k-means++
	const centroids: ColorArray[] = [];
	centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);

	for (let i = 1; i < targetColors; i++) {
		const distances = pixels.map(pixel => {
			const minDist = Math.min(...centroids.map(centroid => {
				const dr = pixel[0] - centroid[0];
				const dg = pixel[1] - centroid[1];
				const db = pixel[2] - centroid[2];
				return dr * dr + dg * dg + db * db;
			}));
			return minDist;
		});

		const totalDistance = distances.reduce((sum, d) => sum + d, 0);
		let random = Math.random() * totalDistance;

		for (let j = 0; j < pixels.length; j++) {
			random -= distances[j];
			if (random <= 0) {
				centroids.push(pixels[j]);
				break;
			}
		}
	}

	// K-means clustering
	for (let iteration = 0; iteration < maxIterations; iteration++) {
		const clusters: ColorArray[][] = Array(targetColors).fill(null).map(() => []);

		// Assign pixels to nearest centroid
		for (const pixel of pixels) {
			let minDistance = Infinity;
			let closestCentroid = 0;

			for (let j = 0; j < centroids.length; j++) {
				const dr = pixel[0] - centroids[j][0];
				const dg = pixel[1] - centroids[j][1];
				const db = pixel[2] - centroids[j][2];
				const distance = dr * dr + dg * dg + db * db;

				if (distance < minDistance) {
					minDistance = distance;
					closestCentroid = j;
				}
			}

			clusters[closestCentroid].push(pixel);
		}

		// Update centroids
		let hasChanged = false;
		for (let j = 0; j < centroids.length; j++) {
			if (clusters[j].length > 0) {
				const newCentroid: ColorArray = [0, 0, 0];
				for (const pixel of clusters[j]) {
					newCentroid[0] += pixel[0];
					newCentroid[1] += pixel[1];
					newCentroid[2] += pixel[2];
				}
				newCentroid[0] = Math.round(newCentroid[0] / clusters[j].length);
				newCentroid[1] = Math.round(newCentroid[1] / clusters[j].length);
				newCentroid[2] = Math.round(newCentroid[2] / clusters[j].length);

				if (newCentroid[0] !== centroids[j][0] ||
					newCentroid[1] !== centroids[j][1] ||
					newCentroid[2] !== centroids[j][2]) {
					centroids[j] = newCentroid;
					hasChanged = true;
				}
			}
		}

		if (!hasChanged) break;
	}

	return centroids.map(centroid => ({
		r: centroid[0],
		g: centroid[1],
		b: centroid[2]
	}));
}

/**
 * Apply advanced dithering to an image with optimizations for e-ink displays
 *
 * @param imageData - Input image data with RGBA channels
 * @param colors - Target color palette to dither to
 * @param options - Dithering options for fine-tuning quality
 * @returns Dithered image data
 *
 * @example
 * // Basic usage with default settings (optimized for e-ink)
 * const dithered = applyDithering(imageData, [
 *   { r: 0, g: 0, b: 0 },       // Black
 *   { r: 255, g: 255, b: 255 }   // White
 * ]);
 *
 * @example
 * // High-quality dithering with all optimizations
 * const dithered = applyDithering(imageData, colors, {
 *   usePerceptualSpace: true,
 *   contrastEnhancement: 0.2,
 *   optimizePalette: true,
 *   algorithm: 'stucki'
 * });
 */
export function applyDithering(imageData: ImageData, colors: Color[], options?: Partial<DitherOptions>): ImageData {
	const { data, width, height } = imageData;

	const opts = {
		colorDistance: perceptualColorDistance,
		algorithm: "stucki", // Excellent for e-ink displays
		serpentine: true,
		gamma: .9,
		usePerceptualSpace: false,
		errorClamping: true,
		contrastEnhancement: .1,
		optimizePalette: false,
		...options,
	} satisfies DitherOptions;

	// Optimize palette if requested
	let finalColors = colors;
	if (opts.optimizePalette) {
		finalColors = optimizePalette(imageData, colors.length);
	}

	// Apply gamma correction for better e-ink perception
	let processedData = applyGammaCorrection(new Uint8ClampedArray(data), opts.gamma);

	// Apply contrast enhancement if requested
	if (opts.contrastEnhancement > 0) {
		processedData = enhanceLocalContrast(processedData, width, height, opts.contrastEnhancement);
	}

	let quantizedData: Uint8ClampedArray;

	switch (opts.algorithm) {
		case "floyd-steinberg":
			quantizedData = floydSteinbergDither(processedData, finalColors, width, height, opts);
			break;
		case "sierra":
			quantizedData = sierraDither(processedData, finalColors, width, height, opts);
			break;
		case "sierra-two-row":
			quantizedData = sierraTwoRowDither(processedData, finalColors, width, height, opts);
			break;
		case "stucki":
			quantizedData = stuckiDither(processedData, finalColors, width, height, opts);
			break;
		default:
			quantizedData = atkinsonDither(processedData, finalColors, 1, height, width, opts);
			break;
	}

	return {
		data: quantizedData,
		width,
		height,
	};
}

/**
 * Enhance local contrast using adaptive histogram equalization
 */
function enhanceLocalContrast(data: Uint8ClampedArray, width: number, height: number, strength: number): Uint8ClampedArray {
	const enhanced = new Uint8ClampedArray(data);
	const windowSize = Math.max(8, Math.min(32, Math.floor(Math.min(width, height) / 16)));

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const pixelIndex = (y * width + x) * 4;

			// Calculate local statistics in a window around the pixel
			let sum = 0, sumSquared = 0, count = 0;
			const halfWindow = Math.floor(windowSize / 2);

			for (let dy = -halfWindow; dy <= halfWindow; dy++) {
				for (let dx = -halfWindow; dx <= halfWindow; dx++) {
					const ny = y + dy;
					const nx = x + dx;

					if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
						const neighborIndex = (ny * width + nx) * 4;
						// Use luminance for contrast calculation
						const luminance = 0.299 * data[neighborIndex] + 0.587 * data[neighborIndex + 1] + 0.114 * data[neighborIndex + 2];
						sum += luminance;
						sumSquared += luminance * luminance;
						count++;
					}
				}
			}

			const mean = sum / count;
			const variance = (sumSquared / count) - (mean * mean);
			const stdDev = Math.sqrt(variance);

			// Apply adaptive contrast enhancement
			for (let c = 0; c < 3; c++) {
				const originalValue = data[pixelIndex + c];
				const normalizedValue = (originalValue - mean) / (stdDev + 1);
				const enhancedValue = mean + normalizedValue * stdDev * (1 + strength);
				enhanced[pixelIndex + c] = Math.max(0, Math.min(255, enhancedValue));
			}
			enhanced[pixelIndex + 3] = data[pixelIndex + 3]; // Keep alpha unchanged
		}
	}

	return enhanced;
}

/**
 * Convert RGB to LAB color space for perceptually accurate distance calculations
 */
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
	// Normalize RGB values
	r /= 255;
	g /= 255;
	b /= 255;

	// Apply gamma correction
	r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
	g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
	b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

	// Convert to XYZ using sRGB matrix
	let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
	let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
	let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

	// Normalize by D65 illuminant
	x /= 0.95047;
	y /= 1.00000;
	z /= 1.08883;

	// Convert to LAB
	const oneThird = 1/3;
	x = x > 0.008856 ? Math.pow(x, oneThird) : (7.787 * x + 16/116);
	y = y > 0.008856 ? Math.pow(y, oneThird) : (7.787 * y + 16/116);
	z = z > 0.008856 ? Math.pow(z, oneThird) : (7.787 * z + 16/116);

	const L = 116 * y - 16;
	const A = 500 * (x - y);
	const B = 200 * (y - z);

	return [L, A, B];
}

/**
 * Delta E 2000 color difference calculation (simplified version)
 *
 * Provides the most perceptually accurate color matching by working
 * in LAB color space. Use with `usePerceptualSpace: true` option
 * for the highest quality color matching, especially important
 * for limited color palettes.
 */
function deltaE2000ColorDistance(color1: ColorArray, color2: Color): number {
	const [L1, a1, b1] = rgbToLab(color1[0], color1[1], color1[2]);
	const [L2, a2, b2] = rgbToLab(color2.r, color2.g, color2.b);

	// Simplified Delta E calculation (full implementation is quite complex)
	const deltaL = L2 - L1;
	const deltaA = a2 - a1;
	const deltaB = b2 - b1;

	// Weighted euclidean distance in LAB space
	const kL = 1.0, kC = 1.0, kH = 1.0;

	return Math.sqrt(
		(deltaL / kL) ** 2 +
		(deltaA / kC) ** 2 +
		(deltaB / kH) ** 2
	);
}

/**
 * Perceptually weighted color distance calculation
 *
 * Uses adaptive weighting based on the red channel average to better
 * match human color perception. More accurate than simple Euclidean
 * distance while being much faster than full Delta E calculations.
 *
 * Recommended as the default color distance function.
 */
function perceptualColorDistance(color1: ColorArray, color2: Color): number {
	const dr = color1[0] - color2.r;
	const dg = color1[1] - color2.g;
	const db = color1[2] - color2.b;

	// Weight channels based on human eye sensitivity
	const avgR = (color1[0] + color2.r) / 2;
	const weightR = 2 + avgR / 256;
	const weightG = 4;
	const weightB = 2 + (255 - avgR) / 256;

	return Math.sqrt(weightR * dr * dr + weightG * dg * dg + weightB * db * db);
}

/**
 * Sierra Two-Row dithering - optimized version of Sierra algorithm
 *
 * Uses only 2 rows instead of 3, making it faster while maintaining high quality.
 * Good balance between performance and quality for e-ink displays.
 *
 * Error distribution pattern spreads errors across 16 neighboring pixels
 * in a 5x2 pattern, providing smooth gradients with minimal artifacts.
 */
function sierraTwoRowDither(uint8data: Uint8ClampedArray, palette: Color[], width: number, height: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Float32Array(uint8data.length);
	const output = new Uint8ClampedArray(uint8data);
	const { findClosestColor } = createColorLookup(palette, options.usePerceptualSpace);

	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const distributeError = (x: number, y: number, error: [number, number, number], factor: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y);
			const errorR = error[0] * factor;
			const errorG = error[1] * factor;
			const errorB = error[2] * factor;

			if (options.errorClamping) {
				// Clamp error to prevent overflow and maintain stability
				imageData[index] = Math.max(-128, Math.min(383, imageData[index] + errorR));
				imageData[index + 1] = Math.max(-128, Math.min(383, imageData[index + 1] + errorG));
				imageData[index + 2] = Math.max(-128, Math.min(383, imageData[index + 2] + errorB));
			} else {
				imageData[index] += errorR;
				imageData[index + 1] += errorG;
				imageData[index + 2] += errorB;
			}
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

			const approximatedColor = findClosestColor(currentColor, options.usePerceptualSpace ? deltaE2000ColorDistance : options.colorDistance);

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
	const invGamma = 1 / gamma;

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
function createColorLookup(palette: Color[], usePerceptualSpace = false): {
	findClosestColor: (color: ColorArray, colorDistance: (c1: ColorArray, c2: Color) => number) => ColorArray;
} {
	// For small palettes (typical for e-ink), linear search is fine
	// For larger palettes, consider k-d tree or other spatial data structures

	const findClosestColor = (color: ColorArray, colorDistance: (c1: ColorArray, c2: Color) => number): ColorArray => {
		let minDistance = Infinity;
		let closestColor = palette[0];

		for (const paletteColor of palette) {
			const distance = usePerceptualSpace ? deltaE2000ColorDistance(color, paletteColor) : colorDistance(color, paletteColor);
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
 * Floyd-Steinberg dithering - classic algorithm with excellent results
 *
 * Distributes quantization error to 4 neighboring pixels in a specific pattern.
 * Often produces better results than Atkinson for e-ink displays due to
 * more even error distribution. Good for images with fine details.
 */
function floydSteinbergDither(uint8data: Uint8ClampedArray, palette: Color[], width: number, height: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Float32Array(uint8data.length);
	const output = new Uint8ClampedArray(uint8data);
	const { findClosestColor } = createColorLookup(palette, options.usePerceptualSpace);

	// Convert to float for better error accumulation
	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const distributeError = (x: number, y: number, error: [number, number, number], factor: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y);
			const errorR = error[0] * factor;
			const errorG = error[1] * factor;
			const errorB = error[2] * factor;

			if (options.errorClamping) {
				imageData[index] = Math.max(-128, Math.min(383, imageData[index] + errorR));
				imageData[index + 1] = Math.max(-128, Math.min(383, imageData[index + 1] + errorG));
				imageData[index + 2] = Math.max(-128, Math.min(383, imageData[index + 2] + errorB));
			} else {
				imageData[index] += errorR;
				imageData[index + 1] += errorG;
				imageData[index + 2] += errorB;
			}
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

			const approximatedColor = findClosestColor(currentColor, options.usePerceptualSpace ? deltaE2000ColorDistance : options.colorDistance);

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
 * Sierra dithering - high-quality algorithm with wide error distribution
 *
 * Distributes error across 10 neighboring pixels in a 5x3 pattern.
 * Provides excellent quality with smooth gradients and minimal artifacts.
 * Good balance between the lighter Sierra Two-Row and heavier Stucki algorithms.
 */
function sierraDither(uint8data: Uint8ClampedArray, palette: Color[], width: number, height: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Float32Array(uint8data.length);
	const output = new Uint8ClampedArray(uint8data);
	const { findClosestColor } = createColorLookup(palette, options.usePerceptualSpace);

	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const distributeError = (x: number, y: number, error: [number, number, number], factor: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y);
			const errorR = error[0] * factor;
			const errorG = error[1] * factor;
			const errorB = error[2] * factor;

			if (options.errorClamping) {
				imageData[index] = Math.max(-128, Math.min(383, imageData[index] + errorR));
				imageData[index + 1] = Math.max(-128, Math.min(383, imageData[index + 1] + errorG));
				imageData[index + 2] = Math.max(-128, Math.min(383, imageData[index + 2] + errorB));
			} else {
				imageData[index] += errorR;
				imageData[index + 1] += errorG;
				imageData[index + 2] += errorB;
			}
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

			const approximatedColor = findClosestColor(currentColor, options.usePerceptualSpace ? deltaE2000ColorDistance : options.colorDistance);

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
	const { findClosestColor } = createColorLookup(palette, options.usePerceptualSpace);

	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const applyError = (x: number, y: number, channelOffset: number, error: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y) + channelOffset;
			const distributedError = error / 8; // Atkinson uses 1/8 error distribution

			if (options.errorClamping) {
				imageData[index] = Math.max(-128, Math.min(383, imageData[index] + distributedError));
			} else {
				imageData[index] += distributedError;
			}
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

			const approximatedColor = findClosestColor(currentColor, options.usePerceptualSpace ? deltaE2000ColorDistance : options.colorDistance);

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

/**
 * Stucki dithering - premium algorithm for highest quality results
 *
 * Uses the largest error distribution pattern (12 pixels in 5x3 grid)
 * for the smoothest possible gradients. Excellent for e-ink displays
 * where quality is more important than processing speed.
 *
 * Produces the most natural-looking results with minimal visible patterns,
 * making it ideal for photographs and images with subtle tonal variations.
 */
function stuckiDither(uint8data: Uint8ClampedArray, palette: Color[], width: number, height: number, options: DitherOptions): Uint8ClampedArray {
	const imageData = new Float32Array(uint8data.length);
	const output = new Uint8ClampedArray(uint8data);
	const { findClosestColor } = createColorLookup(palette, options.usePerceptualSpace);

	for (let i = 0; i < uint8data.length; i++) {
		imageData[i] = uint8data[i];
	}

	const getPixelIndex = (x: number, y: number): number => 4 * (y * width + x);

	const distributeError = (x: number, y: number, error: [number, number, number], factor: number): void => {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			const index = getPixelIndex(x, y);
			const errorR = error[0] * factor;
			const errorG = error[1] * factor;
			const errorB = error[2] * factor;

			if (options.errorClamping) {
				imageData[index] = Math.max(-128, Math.min(383, imageData[index] + errorR));
				imageData[index + 1] = Math.max(-128, Math.min(383, imageData[index + 1] + errorG));
				imageData[index + 2] = Math.max(-128, Math.min(383, imageData[index + 2] + errorB));
			} else {
				imageData[index] += errorR;
				imageData[index + 1] += errorG;
				imageData[index + 2] += errorB;
			}
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

			const approximatedColor = findClosestColor(currentColor, options.usePerceptualSpace ? deltaE2000ColorDistance : options.colorDistance);

			const error: [number, number, number] = [currentColor[0] - approximatedColor[0], currentColor[1] - approximatedColor[1], currentColor[2] - approximatedColor[2]];

			// Stucki error distribution pattern (42 total, 3 rows)
			if (reverse) {
				distributeError(x - 1, y, error, 8 / 42); // Left
				distributeError(x - 2, y, error, 4 / 42); // Left-2
				distributeError(x - 2, y + 1, error, 2 / 42); // Bottom-left-2
				distributeError(x - 1, y + 1, error, 4 / 42); // Bottom-left
				distributeError(x, y + 1, error, 8 / 42); // Bottom
				distributeError(x + 1, y + 1, error, 4 / 42); // Bottom-right
				distributeError(x + 2, y + 1, error, 2 / 42); // Bottom-right-2
				distributeError(x - 2, y + 2, error, 1 / 42); // Bottom2-left-2
				distributeError(x - 1, y + 2, error, 2 / 42); // Bottom2-left
				distributeError(x, y + 2, error, 4 / 42); // Bottom2
				distributeError(x + 1, y + 2, error, 2 / 42); // Bottom2-right
				distributeError(x + 2, y + 2, error, 1 / 42); // Bottom2-right-2
			} else {
				distributeError(x + 1, y, error, 8 / 42); // Right
				distributeError(x + 2, y, error, 4 / 42); // Right-2
				distributeError(x - 2, y + 1, error, 2 / 42); // Bottom-left-2
				distributeError(x - 1, y + 1, error, 4 / 42); // Bottom-left
				distributeError(x, y + 1, error, 8 / 42); // Bottom
				distributeError(x + 1, y + 1, error, 4 / 42); // Bottom-right
				distributeError(x + 2, y + 1, error, 2 / 42); // Bottom-right-2
				distributeError(x - 2, y + 2, error, 1 / 42); // Bottom2-left-2
				distributeError(x - 1, y + 2, error, 2 / 42); // Bottom2-left
				distributeError(x, y + 2, error, 4 / 42); // Bottom2
				distributeError(x + 1, y + 2, error, 2 / 42); // Bottom2-right
				distributeError(x + 2, y + 2, error, 1 / 42); // Bottom2-right-2
			}

			output[pixelIndex] = approximatedColor[0];
			output[pixelIndex + 1] = approximatedColor[1];
			output[pixelIndex + 2] = approximatedColor[2];
		}
	}

	return output;
}

/**
 * Euclidean color distance - standard RGB distance calculation
 * Less accurate than perceptual methods but very fast
 */
export function euclideanColorDistance(color1: ColorArray, color2: Color): number {
	const dr = color1[0] - color2.r;
	const dg = color1[1] - color2.g;
	const db = color1[2] - color2.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Manhattan color distance - fastest color distance calculation
 * Good for basic applications where speed is more important than accuracy
 */
export function manhattanColorDistance(color1: ColorArray, color2: Color): number {
	return Math.abs(color1[0] - color2.r) + Math.abs(color1[1] - color2.g) + Math.abs(color1[2] - color2.b);
}
