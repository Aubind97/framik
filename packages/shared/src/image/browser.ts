import { applyDithering, type Color } from "./dithering";

// For the browser implementation use a slightly dimmed color palette to better match the real render
const COLOR_PALETTE_6_BROWSER = [
	{ r: 255, g: 0, b: 0 }, // Red
	{ r: 0, g: 128, b: 0 }, // Green
	{ r: 0, g: 0, b: 255 }, // Blue
	{ r: 255, g: 255, b: 0 }, // Yellow
	{ r: 0, g: 0, b: 0 }, // Black
	{ r: 255, g: 255, b: 255 }, // White
] satisfies Color[];

// Browser-compatible function
export async function applyDitheringBrowser(base64Image: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Could not get 2D context"));
				return;
			}

			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

			const dithered = applyDithering(imageData, COLOR_PALETTE_6_BROWSER);
			ctx.putImageData(new ImageData(dithered.data, dithered.width, dithered.height), 0, 0);

			resolve(canvas.toDataURL());
		};
		img.onerror = reject;
		img.src = base64Image;
	});
}
