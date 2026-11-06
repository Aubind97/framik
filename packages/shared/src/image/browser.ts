import { applyDithering, type DitherOptions, EPAPER_MEASURED_COLORS } from "./dithering";

// Browser-compatible function
export async function applyDitheringBrowser(base64Image: string, options?: Partial<DitherOptions>): Promise<string> {
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

			const dithered = applyDithering(imageData, EPAPER_MEASURED_COLORS, options);
			ctx.putImageData(new ImageData(dithered.data, dithered.width, dithered.height), 0, 0);

			resolve(canvas.toDataURL());
		};
		img.onerror = reject;
		img.src = base64Image;
	});
}
