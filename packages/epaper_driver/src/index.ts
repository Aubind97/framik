import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Import the native addon
const addon = require(join(__dirname, '../build/Release/epd_addon.node'));

export interface Colors {
  BLACK: number;
  WHITE: number;
  YELLOW: number;
  RED: number;
  BLUE: number;
  GREEN: number;
}

export interface EPDDisplayOptions {
  width?: number;
  height?: number;
}

export interface ColorMappingOptions {
  threshold?: number;
  exactMapping?: boolean;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface ColorDistribution {
  colors: Map<number, number>;
  totalPixels: number;
  uniqueColors: number;
}

export class EPaperDriver {
  private epd: any;

  constructor() {
    this.epd = new addon.EPD7in3e();
  }

  get width(): number {
    return this.epd.getWidth();
  }

  get height(): number {
    return this.epd.getHeight();
  }

  get bufferSize(): number {
    return this.epd.getBufferSize();
  }

  get colors(): Colors {
    return this.epd.getColors();
  }

  /**
   * Initialize the e-Paper display
   */
  init(): void {
    this.epd.init();
  }

  /**
   * Clear the display with a specified color
   */
  clear(color?: number): void {
    this.epd.clear(color);
  }

  /**
   * Display the 7-color block test pattern
   */
  show7Block(): void {
    this.epd.show7Block();
  }

  /**
   * Display the color test pattern
   */
  show(): void {
    this.epd.show();
  }

  /**
   * Display an image buffer
   */
  display(imageBuffer: Buffer): void {
    this.epd.display(imageBuffer);
  }

  /**
   * Put the display to sleep mode
   */
  sleep(): void {
    this.epd.sleep();
  }

  /**
   * Exit and cleanup the module
   */
  exit(): void {
    this.epd.exit();
  }

  /**
   * Create a blank image buffer
   */
  createBuffer(color?: number): Buffer {
    return this.epd.createBuffer(color);
  }

  /**
   * Set a pixel in the image buffer
   */
  setPixel(buffer: Buffer, x: number, y: number, color: number): void {
    this.epd.setPixel(buffer, x, y, color);
  }

  /**
   * Set a pixel using RGB values
   */
  setPixelRGB(buffer: Buffer, x: number, y: number, r: number, g: number, b: number): void {
    this.epd.setPixelRGB(buffer, x, y, r, g, b);
  }

  /**
   * Get a pixel from the image buffer
   */
  getPixel(buffer: Buffer, x: number, y: number): number {
    return this.epd.getPixel(buffer, x, y);
  }

  /**
   * Map RGB color to display color
   */
  mapRGBToDisplayColor(r: number, g: number, b: number): number {
    return this.epd.mapRGBToDisplayColor(r, g, b);
  }

  /**
   * Create buffer from RGB data
   */
  createBufferFromRGB(rgbBuffer: Buffer, width: number, height: number): Buffer {
    return this.epd.createBufferFromRGB(rgbBuffer, width, height);
  }

  /**
   * Create buffer from RGB data with advanced options
   */
  createBufferFromRGBAdvanced(rgbBuffer: Buffer, width: number, height: number, options?: ColorMappingOptions): Buffer {
    return this.epd.createBufferFromRGBAdvanced(rgbBuffer, width, height, options);
  }

  /**
   * Create full color test pattern
   */
  createFullColorTestPattern(): Buffer {
    return this.epd.createFullColorTestPattern();
  }

  /**
   * Convert HSL to RGB
   */
  hslToRgb(h: number, s: number, l: number): RGBColor {
    return this.epd.hslToRgb(h, s, l);
  }

  /**
   * Analyze color distribution in buffer
   */
  analyzeColorDistribution(buffer: Buffer): ColorDistribution {
    return this.epd.analyzeColorDistribution(buffer);
  }
}

// Export the color constants
export const Colors: Colors = addon.Colors || {
  BLACK: 0,
  WHITE: 1,
  YELLOW: 2,
  RED: 3,
  BLUE: 4,
  GREEN: 5
};

// Default export
export default EPaperDriver;

// Legacy compatibility exports
export { EPaperDriver as EPD7in3e };