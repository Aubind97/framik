import { applyFloydSteinbergDithering } from "./dithering";

// Browser-compatible function
export async function applyFloydSteinbergDitheringBrowser(base64Image: string): Promise<string> {
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

			const dithered = applyFloydSteinbergDithering(imageData);
			ctx.putImageData(new ImageData(dithered.data, dithered.width, dithered.height), 0, 0);

			resolve(canvas.toDataURL());
		};
		img.onerror = reject;
		img.src = base64Image;
	});
}
