import { expect, test } from "bun:test";
import { getPlacement } from "./transform-image";

const frame = { width: 800, height: 480 };

test("zoom 1 covers the frame, centered", () => {
	expect(getPlacement({ width: 1600, height: 1600 }, frame, { zoom: 1, x: 0, y: 0, rotation: 0 })).toMatchObject({ scale: 0.5, centerX: 400, centerY: 240 });
});

test("pan reaches exactly the image edge", () => {
	// drawn 800x800: 320px vertical overflow
	const { centerY } = getPlacement({ width: 1600, height: 1600 }, frame, { zoom: 1, x: 1, y: 1, rotation: 0 });
	expect(centerY - 400).toBe(480 - 800);
});

test("90° rotation swaps the source dimensions for cover", () => {
	// portrait 480x800 rotated becomes 800x480: exact fit
	expect(getPlacement({ width: 480, height: 800 }, frame, { zoom: 1, x: 1, y: 1, rotation: 90 })).toMatchObject({ scale: 1, overflowX: 0, overflowY: 0 });
});
