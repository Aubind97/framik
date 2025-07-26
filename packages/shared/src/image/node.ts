import { Jimp } from "jimp";
import { applyFloydSteinbergDithering } from "./dithering";

export const applyFloydSteinbergDitheringNode = async (base64Image: string): Promise<string> => {
	const { createCanvas, loadImage } = await import("canvas");

	const image = await loadImage(`data:image/png;base64,${base64Image}`);
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");

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
