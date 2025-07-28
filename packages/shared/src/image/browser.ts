import { Jimp } from "jimp";
import { applyFloydSteinbergDithering } from "./dithering";

export const applyFloydSteinbergDitheringBrowser = async (base64Image: string): Promise<string> => {
	const image = new Image();
	image.src = base64Image;

	await new Promise((resolve, reject) => {
		image.onload = resolve;
		image.onerror = reject;
	});

	const canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Could not get 2D context from canvas");
	}

	ctx.drawImage(image, 0, 0);

	const canvasImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const jimpImage = await Jimp.fromBitmap(canvasImage);

	jimpImage.contrast(0).brightness(1);

	const imageData = new ImageData(new Uint8ClampedArray(jimpImage.bitmap.data), jimpImage.bitmap.width, jimpImage.bitmap.height);

	// Reduce the color spectrum using Floyd Steinberg dithering algorithm
	applyFloydSteinbergDithering(imageData);

	ctx.putImageData(imageData, 0, 0);

	return canvas.toDataURL();
};
