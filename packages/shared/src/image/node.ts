import { applyFloydSteinbergDithering } from "./dithering.js";

export const applyFloydSteinbergDitheringNode = async (base64Image: string): Promise<string> => {
	const { createCanvas, loadImage } = await import("canvas");

	const image = await loadImage(`data:image/png;base64,${base64Image}`);
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");

	ctx.drawImage(image, 0, 0);

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	applyFloydSteinbergDithering(imageData);

	ctx.putImageData(imageData, 0, 0);

	return canvas.toDataURL();
};
