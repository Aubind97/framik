import RgbQuant from "rgbquant";

type Color = { r: number; g: number; b: number };

interface ImageData {
	data: Uint8ClampedArray;
	width: number;
	height: number;
}

const COLOR_PALETTE_6: readonly Color[] = [
	{ r: 255, g: 0, b: 0 }, // Red
	{ r: 0, g: 255, b: 0 }, // Green
	{ r: 0, g: 0, b: 255 }, // Blue
	{ r: 255, g: 255, b: 0 }, // Yellow
	{ r: 0, g: 0, b: 0 }, // Black
	{ r: 255, g: 255, b: 255 }, // White
];

export function applyFloydSteinbergDithering(imageData: ImageData): ImageData {
	const { data, width, height } = imageData;

	// Convert palette to RgbQuant format
	const palette = COLOR_PALETTE_6.map((c) => [c.r, c.g, c.b]);

	const q = new RgbQuant({
		colors: 6,
		method: 2, // Floyd-Steinberg dithering
		palette: palette,
		boxSize: [64, 64], // subregion dims (if method = 2)
		boxPxls: 2, // min-population threshold (if method = 2)
		minHueCols: 0, // # of colors per hue group to evaluate regardless of counts, to retain low-count hues
		dithKern: "TwoSierra", // FloydSteinberg | FalseFloydSteinberg | Stucki | Atkinson | Jarvis | Burkes | TwoSierra | TwoSierra
		dithDelta: 0.02, // dithering threshhold (0-1) e.g: 0.05 will not dither colors with <= 5% difference
		dithSerp: true, // enable serpentine pattern dithering
		reIndex: false, // affects predefined palettes only. if true, allows compacting of sparsed palette once target palette size is reached. also enables palette sorting.
		useCache: true, // enables caching for perf usually, but can reduce perf in some cases, like pre-def palettes
		cacheFreq: 10, // min color occurance count needed to qualify for caching
		colorDist: "euclidean", // manhattan | euclidean
	});

	// Convert Uint8ClampedArray to regular array for RgbQuant
	const rgbArray = Array.from(data);

	// Apply quantization with dithering
	const quantized = q.reduce(rgbArray); // 2 = return as array

	return {
		data: new Uint8ClampedArray(quantized),
		width,
		height,
	};
}
