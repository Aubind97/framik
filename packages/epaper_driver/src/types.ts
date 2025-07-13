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

export class EPD7in3e {
  readonly width: number;
  readonly height: number;
  readonly bufferSize: number;
  readonly colors: Colors;

  constructor();

  /**
   * Initialize the e-Paper display
   * Must be called before any other operations
   */
  init(): void;

  /**
   * Clear the display with a specified color
   * @param color - Color value (use Colors constants)
   */
  clear(color?: number): void;

  /**
   * Display the 7-color block test pattern
   */
  show7Block(): void;

  /**
   * Display the color test pattern
   */
  show(): void;

  /**
   * Display an image buffer
   * @param imageBuffer - Image data buffer
   */
  display(imageBuffer: Buffer): void;

  /**
   * Put the display to sleep mode
   */
  sleep(): void;

  /**
   * Exit and cleanup the module
   */
  exit(): void;

  /**
   * Get display width
   * @returns Width in pixels
   */
  getWidth(): number;

  /**
   * Get display height
   * @returns Height in pixels
   */
  getHeight(): number;

  /**
   * Get buffer size needed for display
   * @returns Buffer size in bytes
   */
  getBufferSize(): number;

  /**
   * Get color constants
   * @returns Color constants object
   */
  getColors(): Colors;

  /**
   * Create a blank image buffer
   * @param color - Fill color (default: WHITE)
   * @returns Image buffer
   */
  createBuffer(color?: number): Buffer;

  /**
   * Set a pixel in the image buffer
   * @param buffer - Image buffer
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param color - Color value
   */
  setPixel(buffer: Buffer, x: number, y: number, color: number): void;

  /**
   * Set a pixel using RGB values
   * @param buffer - Image buffer
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param r - Red component (0-255)
   * @param g - Green component (0-255)
   * @param b - Blue component (0-255)
   */
  setPixelRGB(buffer: Buffer, x: number, y: number, r: number, g: number, b: number): void;

  /**
   * Get a pixel from the image buffer
   * @param buffer - Image buffer
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Color value
   */
  getPixel(buffer: Buffer, x: number, y: number): number;

  /**
   * Map RGB color to display color
   * @param r - Red component (0-255)
   * @param g - Green component (0-255)
   * @param b - Blue component (0-255)
   * @returns Display color value
   */
  mapRGBToDisplayColor(r: number, g: number, b: number): number;

  /**
   * Create buffer from RGB data
   * @param rgbBuffer - RGB buffer
   * @param width - Image width
   * @param height - Image height
   * @returns Display buffer
   */
  createBufferFromRGB(rgbBuffer: Buffer, width: number, height: number): Buffer;

  /**
   * Create buffer from RGB data with advanced options
   * @param rgbBuffer - RGB buffer
   * @param width - Image width
   * @param height - Image height
   * @param options - Color mapping options
   * @returns Display buffer
   */
  createBufferFromRGBAdvanced(rgbBuffer: Buffer, width: number, height: number, options?: ColorMappingOptions): Buffer;

  /**
   * Create full color test pattern
   * @returns Display buffer with test pattern
   */
  createFullColorTestPattern(): Buffer;

  /**
   * Convert HSL to RGB
   * @param h - Hue (0-360)
   * @param s - Saturation (0-1)
   * @param l - Lightness (0-1)
   * @returns RGB color object
   */
  hslToRgb(h: number, s: number, l: number): RGBColor;

  /**
   * Analyze color distribution in buffer
   * @param buffer - Display buffer
   * @returns Color distribution analysis
   */
  analyzeColorDistribution(buffer: Buffer): ColorDistribution;
}

export const Colors: Colors;