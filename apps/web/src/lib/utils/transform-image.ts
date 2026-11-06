export type ImageTransform = { zoom: number; x: number; y: number; rotation: number };

type Size = { width: number; height: number };

export function getPlacement(source: Size, target: Size, { zoom, x, y, rotation }: ImageTransform) {
	const sideways = rotation % 180 !== 0;
	const rotatedWidth = sideways ? source.height : source.width;
	const rotatedHeight = sideways ? source.width : source.height;
	const scale = Math.max(target.width / rotatedWidth, target.height / rotatedHeight) * zoom;
	const overflowX = rotatedWidth * scale - target.width;
	const overflowY = rotatedHeight * scale - target.height;

	return {
		scale,
		overflowX,
		overflowY,
		centerX: target.width / 2 - (x * overflowX) / 2,
		centerY: target.height / 2 - (y * overflowY) / 2,
	};
}

export async function loadImage(source: string) {
	const img = new Image();
	img.src = source;
	await img.decode();
	return img;
}

export function transformImage(img: HTMLImageElement, target: Size, transform: ImageTransform) {
	const canvas = document.createElement("canvas");
	canvas.width = target.width;
	canvas.height = target.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D context unavailable");

	const { scale, centerX, centerY } = getPlacement({ width: img.naturalWidth, height: img.naturalHeight }, target, transform);
	const width = img.naturalWidth * scale;
	const height = img.naturalHeight * scale;

	ctx.translate(centerX, centerY);
	ctx.rotate((transform.rotation * Math.PI) / 180);
	ctx.drawImage(img, -width / 2, -height / 2, width, height);

	return canvas.toDataURL("image/jpeg");
}
