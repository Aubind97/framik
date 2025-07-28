// Browser-compatible function
export async function applyFloydSteinbergDitheringBrowser(base64Image: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get 2D context'));
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