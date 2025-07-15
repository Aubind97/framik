import { applyFloydSteinbergDithering } from "./dithering.js";

export const applyFloydSteinbergDitheringBrowser = async (base64Image: string): Promise<string> => {
	const image = new Image();
	image.src = `data:image/png;base64,${base64Image}`;

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

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	applyFloydSteinbergDithering(imageData);

	ctx.putImageData(imageData, 0, 0);

	return canvas.toDataURL();
};
