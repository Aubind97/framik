import { dlopen, FFIType, suffix } from "bun:ffi";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine library path
const libPath = join(__dirname, "..", "lib", `libepd.${suffix}`);

// Define FFI interface
const lib = dlopen(libPath, {
	// Core display functions
	epd_init: {
		args: [],
		returns: FFIType.i32,
	},
	epd_clear: {
		args: [FFIType.i32],
		returns: FFIType.i32,
	},
	epd_show7block: {
		args: [],
		returns: FFIType.i32,
	},
	epd_show: {
		args: [],
		returns: FFIType.i32,
	},
	epd_display: {
		args: [FFIType.ptr, FFIType.i32],
		returns: FFIType.i32,
	},
	epd_sleep: {
		args: [],
		returns: FFIType.i32,
	},
	epd_exit: {
		args: [],
		returns: FFIType.i32,
	},

	// Display properties
	epd_get_width: {
		args: [],
		returns: FFIType.i32,
	},
	epd_get_height: {
		args: [],
		returns: FFIType.i32,
	},
	epd_get_buffer_size: {
		args: [],
		returns: FFIType.i32,
	},

	// Color constants
	epd_get_color_black: {
		args: [],
		returns: FFIType.i32,
	},
	epd_get_color_white: {
		args: [],
		returns: FFIType.i32,
	},
	epd_get_color_yellow: {
		args: [],
		returns: FFIType.i32,
	},
	epd_get_color_red: {
		args: [],
		returns: FFIType.i32,
	},
	epd_get_color_blue: {
		args: [],
		returns: FFIType.i32,
	},
	epd_get_color_green: {
		args: [],
		returns: FFIType.i32,
	},

	// Buffer operations
	epd_create_buffer: {
		args: [FFIType.i32],
		returns: FFIType.ptr,
	},
	epd_free_buffer: {
		args: [FFIType.ptr],
		returns: FFIType.void,
	},
	epd_set_pixel: {
		args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32],
		returns: FFIType.i32,
	},
	epd_get_pixel: {
		args: [FFIType.ptr, FFIType.i32, FFIType.i32],
		returns: FFIType.i32,
	},

	// Utility functions
	epd_map_rgb_to_display_color: {
		args: [FFIType.i32, FFIType.i32, FFIType.i32],
		returns: FFIType.i32,
	},
	epd_is_initialized: {
		args: [],
		returns: FFIType.i32,
	},
	epd_get_version: {
		args: [],
		returns: FFIType.cstring,
	},
});

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
	private _colors: Colors | null = null;

	get width(): number {
		return lib.symbols.epd_get_width();
	}

	get height(): number {
		return lib.symbols.epd_get_height();
	}

	get bufferSize(): number {
		return lib.symbols.epd_get_buffer_size();
	}

	get colors(): Colors {
		if (!this._colors) {
			this._colors = {
				BLACK: lib.symbols.epd_get_color_black(),
				WHITE: lib.symbols.epd_get_color_white(),
				YELLOW: lib.symbols.epd_get_color_yellow(),
				RED: lib.symbols.epd_get_color_red(),
				BLUE: lib.symbols.epd_get_color_blue(),
				GREEN: lib.symbols.epd_get_color_green(),
			};
		}
		return this._colors;
	}

	get version(): string {
		return lib.symbols.epd_get_version().toString(); // FIXME: no need to call toString()
	}

	get isInitialized(): boolean {
		return lib.symbols.epd_is_initialized() === 1;
	}

	/**
	 * Initialize the e-Paper display
	 */
	init(): void {
		const result = lib.symbols.epd_init();
		if (result !== 0) {
			throw new Error(`Failed to initialize e-Paper display (error code: ${result})`);
		}
	}

	/**
	 * Clear the display with a specified color
	 */
	clear(color?: number): void {
		const colorValue = color ?? this.colors.WHITE;
		const result = lib.symbols.epd_clear(colorValue);
		if (result !== 0) {
			throw new Error(`Failed to clear display (error code: ${result})`);
		}
	}

	/**
	 * Display the 7-color block test pattern
	 */
	show7Block(): void {
		const result = lib.symbols.epd_show7block();
		if (result !== 0) {
			throw new Error(`Failed to show 7-color block pattern (error code: ${result})`);
		}
	}

	/**
	 * Display the color test pattern
	 */
	show(): void {
		const result = lib.symbols.epd_show();
		if (result !== 0) {
			throw new Error(`Failed to show color pattern (error code: ${result})`);
		}
	}

	/**
	 * Display an image buffer
	 */
	display(imageBuffer: Buffer | Uint8Array): void {
		if (!imageBuffer) {
			throw new Error("Image buffer is required");
		}

		const expectedSize = this.bufferSize;
		if (imageBuffer.length !== expectedSize) {
			throw new Error(`Buffer size mismatch. Expected ${expectedSize} bytes, got ${imageBuffer.length}`);
		}

		// Convert to Uint8Array if needed for FFI compatibility
		const uint8Buffer = imageBuffer instanceof Buffer ? new Uint8Array(imageBuffer) : imageBuffer;

		const result = lib.symbols.epd_display(uint8Buffer, uint8Buffer.length);
		if (result !== 0) {
			if (result === -2) {
				throw new Error("Buffer size mismatch");
			}
			throw new Error(`Failed to display image (error code: ${result})`);
		}
	}

	/**
	 * Put the display to sleep mode
	 */
	sleep(): void {
		const result = lib.symbols.epd_sleep();
		if (result !== 0) {
			throw new Error(`Failed to put display to sleep (error code: ${result})`);
		}
	}

	/**
	 * Exit and cleanup the module
	 */
	exit(): void {
		const result = lib.symbols.epd_exit();
		if (result !== 0) {
			throw new Error(`Failed to exit display module (error code: ${result})`);
		}
	}

	/**
	 * Create a blank image buffer
	 */
	createBuffer(color?: number): Uint8Array {
		const colorValue = color ?? this.colors.WHITE;
		const size = this.bufferSize;
		const buffer = new Uint8Array(size);

		// Fill buffer with the specified color
		const fillValue = (colorValue << 4) | colorValue;
		buffer.fill(fillValue);

		return buffer;
	}

	/**
	 * Set a pixel in the image buffer
	 */
	setPixel(buffer: Uint8Array, x: number, y: number, color: number): void {
		// This is a JavaScript implementation since we're working with JS buffers
		if (!buffer || x < 0 || y < 0 || x >= this.width || y >= this.height) {
			throw new Error("Invalid buffer or coordinates");
		}

		const width = this.width % 2 === 0 ? this.width / 2 : this.width / 2 + 1;
		const byteIndex = y * width + Math.floor(x / 2);

		if (byteIndex >= buffer.length) {
			throw new Error("Pixel coordinates out of buffer bounds");
		}

		if (x % 2 === 0) {
			// Left pixel (upper 4 bits)
			buffer[byteIndex] = (buffer[byteIndex] & 0x0f) | ((color & 0x0f) << 4);
		} else {
			// Right pixel (lower 4 bits)
			buffer[byteIndex] = (buffer[byteIndex] & 0xf0) | (color & 0x0f);
		}
	}

	/**
	 * Get a pixel from the image buffer
	 */
	getPixel(buffer: Uint8Array, x: number, y: number): number {
		if (!buffer || x < 0 || y < 0 || x >= this.width || y >= this.height) {
			throw new Error("Invalid buffer or coordinates");
		}

		const width = this.width % 2 === 0 ? this.width / 2 : this.width / 2 + 1;
		const byteIndex = y * width + Math.floor(x / 2);

		if (byteIndex >= buffer.length) {
			throw new Error("Pixel coordinates out of buffer bounds");
		}

		if (x % 2 === 0) {
			// Left pixel (upper 4 bits)
			return (buffer[byteIndex] >> 4) & 0x0f;
		} else {
			// Right pixel (lower 4 bits)
			return buffer[byteIndex] & 0x0f;
		}
	}

	/**
	 * Map RGB color to display color
	 */
	mapRGBToDisplayColor(r: number, g: number, b: number): number {
		return lib.symbols.epd_map_rgb_to_display_color(r, g, b);
	}

	/**
	 * Create buffer from RGB data
	 */
	createBufferFromRGB(rgbBuffer: Uint8Array, width: number, height: number): Uint8Array {
		if (rgbBuffer.length !== width * height * 3) {
			throw new Error("RGB buffer size mismatch");
		}

		const displayBuffer = new Uint8Array(this.bufferSize);

		for (let y = 0; y < height && y < this.height; y++) {
			for (let x = 0; x < width && x < this.width; x++) {
				const rgbIndex = (y * width + x) * 3;
				const r = rgbBuffer[rgbIndex];
				const g = rgbBuffer[rgbIndex + 1];
				const b = rgbBuffer[rgbIndex + 2];

				const color = this.mapRGBToDisplayColor(r, g, b);
				this.setPixel(displayBuffer, x, y, color);
			}
		}

		return displayBuffer;
	}

	/**
	 * Create buffer from RGB data with advanced options
	 */
	createBufferFromRGBAdvanced(rgbBuffer: Uint8Array, width: number, height: number): Uint8Array {
		return this.createBufferFromRGB(rgbBuffer, width, height);
	}

	/**
	 * Create full color test pattern
	 */
	createFullColorTestPattern(): Uint8Array {
		const buffer = new Uint8Array(this.bufferSize);
		const colors = [this.colors.BLACK, this.colors.WHITE, this.colors.YELLOW, this.colors.RED, this.colors.BLUE, this.colors.GREEN];

		const sectionHeight = Math.floor(this.height / colors.length);

		for (let y = 0; y < this.height; y++) {
			const colorIndex = Math.floor(y / sectionHeight);
			const color = colors[Math.min(colorIndex, colors.length - 1)];

			for (let x = 0; x < this.width; x++) {
				this.setPixel(buffer, x, y, color);
			}
		}

		return buffer;
	}

	/**
	 * Convert HSL to RGB
	 */
	hslToRgb(h: number, s: number, l: number): RGBColor {
		h = h % 360;
		s = Math.max(0, Math.min(1, s));
		l = Math.max(0, Math.min(1, l));

		const c = (1 - Math.abs(2 * l - 1)) * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = l - c / 2;

		let r: number, g: number, b: number;

		if (h < 60) {
			[r, g, b] = [c, x, 0];
		} else if (h < 120) {
			[r, g, b] = [x, c, 0];
		} else if (h < 180) {
			[r, g, b] = [0, c, x];
		} else if (h < 240) {
			[r, g, b] = [0, x, c];
		} else if (h < 300) {
			[r, g, b] = [x, 0, c];
		} else {
			[r, g, b] = [c, 0, x];
		}

		return {
			r: Math.round((r + m) * 255),
			g: Math.round((g + m) * 255),
			b: Math.round((b + m) * 255),
		};
	}

	/**
	 * Analyze color distribution in buffer
	 */
	analyzeColorDistribution(buffer: Uint8Array): ColorDistribution {
		const colorCount = new Map<number, number>();
		let totalPixels = 0;

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const color = this.getPixel(buffer, x, y);
				colorCount.set(color, (colorCount.get(color) || 0) + 1);
				totalPixels++;
			}
		}

		return {
			colors: colorCount,
			totalPixels,
			uniqueColors: colorCount.size,
		};
	}
}

// Export the color constants
export const Colors: Colors = {
	BLACK: 0,
	WHITE: 1,
	YELLOW: 2,
	RED: 3,
	BLUE: 5,
	GREEN: 6,
};

// Default export
export default EPaperDriver;

// Legacy compatibility exports
export { EPaperDriver as EPD7in3e };
