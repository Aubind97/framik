type Color = { r: number; g: number; b: number };

interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

const COLOR_PALETTE_6: readonly Color[] = [
  { r: 255, g: 0, b: 0 },   // Red
  { r: 0, g: 255, b: 0 },   // Green
  { r: 0, g: 0, b: 255 },   // Blue
  { r: 255, g: 255, b: 0 }, // Yellow
  { r: 0, g: 0, b: 0 },     // Black
  { r: 255, g: 255, b: 255 } // White
];

function findClosestPaletteColor(color: Color): Color {
  let closestColor = COLOR_PALETTE_6[0];
  let minDistance = Infinity;

  for (const paletteColor of COLOR_PALETTE_6) {
    const dr = color.r - paletteColor.r;
    const dg = color.g - paletteColor.g;
    const db = color.b - paletteColor.b;
    const distance = dr * dr + dg * dg + db * db; // Skip sqrt for performance

    if (distance < minDistance) {
      closestColor = paletteColor;
      minDistance = distance;
    }
  }

  return closestColor;
}

function distributeError(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  errR: number,
  errG: number,
  errB: number,
  factor: number
): void {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    const index = (y * width + x) * 4;
    data[index] = Math.max(0, Math.min(255, data[index] + errR * factor));
    data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + errG * factor));
    data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + errB * factor));
  }
}

export function applyFloydSteinbergDithering(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  
  // Create a copy to avoid modifying the original
  const result = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      const oldColor: Color = {
        r: result[index],
        g: result[index + 1],
        b: result[index + 2]
      };

      const newColor = findClosestPaletteColor(oldColor);
      
      result[index] = newColor.r;
      result[index + 1] = newColor.g;
      result[index + 2] = newColor.b;
      // Alpha channel remains unchanged

      const errR = oldColor.r - newColor.r;
      const errG = oldColor.g - newColor.g;
      const errB = oldColor.b - newColor.b;

      // Floyd-Steinberg error distribution
      distributeError(result, x + 1, y, width, height, errR, errG, errB, 7/16);
      distributeError(result, x - 1, y + 1, width, height, errR, errG, errB, 3/16);
      distributeError(result, x, y + 1, width, height, errR, errG, errB, 5/16);
      distributeError(result, x + 1, y + 1, width, height, errR, errG, errB, 1/16);
    }
  }

  return { data: result, width, height };
}