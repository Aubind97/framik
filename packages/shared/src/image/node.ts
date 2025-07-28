// Node.js-compatible function (requires sharp package)
export async function applyFloydSteinbergDitheringNode(base64Image: string): Promise<string> {
  try {
    // Dynamic import to avoid issues when sharp is not available
    const sharp = (await import('sharp')).default;

    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const image = sharp(buffer);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    // Convert to RGBA format
    const rgba = new Uint8ClampedArray(info.width * info.height * 4);
    for (let i = 0; i < info.width * info.height; i++) {
      const srcIdx = i * info.channels;
      const dstIdx = i * 4;
      rgba[dstIdx] = data[srcIdx];     // R
      rgba[dstIdx + 1] = data[srcIdx + 1]; // G
      rgba[dstIdx + 2] = data[srcIdx + 2]; // B
      rgba[dstIdx + 3] = info.channels === 4 ? data[srcIdx + 3] : 255; // A
    }

    const imageData = { data: rgba, width: info.width, height: info.height };
    const dithered = applyFloydSteinbergDithering(imageData);

    // Convert back to RGB and create PNG
    const rgbData = Buffer.alloc(info.width * info.height * 3);
    for (let i = 0; i < info.width * info.height; i++) {
      const srcIdx = i * 4;
      const dstIdx = i * 3;
      rgbData[dstIdx] = dithered.data[srcIdx];     // R
      rgbData[dstIdx + 1] = dithered.data[srcIdx + 1]; // G
      rgbData[dstIdx + 2] = dithered.data[srcIdx + 2]; // B
    }

    const outputBuffer = await sharp(rgbData, {
      raw: { width: info.width, height: info.height, channels: 3 }
    }).png().toBuffer();

    return `${outputBuffer.toString('base64')}`;
  } catch (error) {
    throw new Error(`Sharp processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function applyFloydSteinbergDithering(imageData: { data: Uint8ClampedArray; width: number; height: number }) {
  const COLOR_PALETTE_6 = [
    { r: 255, g: 0, b: 0 },   // Red
    { r: 0, g: 255, b: 0 },   // Green
    { r: 0, g: 0, b: 255 },   // Blue
    { r: 255, g: 255, b: 0 }, // Yellow
    { r: 0, g: 0, b: 0 },     // Black
    { r: 255, g: 255, b: 255 } // White
  ];

  function findClosestPaletteColor(color: { r: number; g: number; b: number }) {
    let closestColor = COLOR_PALETTE_6[0];
    let minDistance = Infinity;

    for (const paletteColor of COLOR_PALETTE_6) {
      const dr = color.r - paletteColor.r;
      const dg = color.g - paletteColor.g;
      const db = color.b - paletteColor.b;
      const distance = dr * dr + dg * dg + db * db;

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

  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      const oldColor = {
        r: result[index],
        g: result[index + 1],
        b: result[index + 2]
      };

      const newColor = findClosestPaletteColor(oldColor);

      result[index] = newColor.r;
      result[index + 1] = newColor.g;
      result[index + 2] = newColor.b;

      const errR = oldColor.r - newColor.r;
      const errG = oldColor.g - newColor.g;
      const errB = oldColor.b - newColor.b;

      distributeError(result, x + 1, y, width, height, errR, errG, errB, 7/16);
      distributeError(result, x - 1, y + 1, width, height, errR, errG, errB, 3/16);
      distributeError(result, x, y + 1, width, height, errR, errG, errB, 5/16);
      distributeError(result, x + 1, y + 1, width, height, errR, errG, errB, 1/16);
    }
  }

  return { data: result, width, height };
}
