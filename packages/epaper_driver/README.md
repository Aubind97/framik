# @framink/epaper_driver

A high-performance e-Paper display driver for the Waveshare 7.3inch e-Paper display (EPD_7in3e) using Bun's FFI system.

## Features

- **Fast FFI Interface**: Uses Bun's native FFI instead of Node-API for better performance
- **No Compilation Required**: Shared library approach eliminates node-gyp complexity
- **7-Color Support**: Full support for BLACK, WHITE, YELLOW, RED, BLUE, GREEN colors
- **TypeScript Ready**: Complete TypeScript definitions and modern ES modules
- **Hardware Compatibility**: Supports Raspberry Pi and Jetson Nano
- **Memory Efficient**: Direct memory management with proper cleanup

## Installation

```bash
bun add @framink/epaper_driver
```

### System Requirements

**Raspberry Pi:**
```bash
sudo apt-get update
sudo apt-get install build-essential libgpiod-dev
```

**Jetson Nano:**
```bash
sudo apt-get update
sudo apt-get install build-essential libgpiod-dev
```

### Build the Native Library

```bash
cd node_modules/@framink/epaper_driver
make build-rpi     # For Raspberry Pi
# or
make build-jetson  # For Jetson Nano
```

## Quick Start

```typescript
import { EPaperDriver } from "@framink/epaper_driver";

const epd = new EPaperDriver();

try {
  // Initialize the display
  epd.init();
  
  // Clear with white background
  epd.clear(epd.colors.WHITE);
  
  // Show 7-color test pattern
  epd.show7Block();
  
  // Create custom image
  const buffer = epd.createBuffer(epd.colors.WHITE);
  epd.setPixel(buffer, 100, 100, epd.colors.RED);
  epd.display(buffer);
  
  // Sleep mode
  epd.sleep();
  
} finally {
  // Always cleanup
  epd.exit();
}
```

## API Reference

### EPaperDriver Class

#### Properties

- `width: number` - Display width (800px)
- `height: number` - Display height (480px)  
- `bufferSize: number` - Required buffer size in bytes
- `colors: Colors` - Available color constants
- `version: string` - Driver version
- `isInitialized: boolean` - Initialization status

#### Methods

##### Display Control

- `init(): void` - Initialize the display
- `clear(color?: number): void` - Clear display with color
- `display(buffer: Uint8Array): void` - Display image buffer
- `sleep(): void` - Put display to sleep
- `exit(): void` - Cleanup and exit

##### Test Patterns

- `show7Block(): void` - Display 7-color block pattern
- `show(): void` - Display color test pattern
- `createFullColorTestPattern(): Uint8Array` - Create test pattern buffer

##### Buffer Operations

- `createBuffer(color?: number): Uint8Array` - Create blank buffer
- `setPixel(buffer: Uint8Array, x: number, y: number, color: number): void` - Set pixel
- `getPixel(buffer: Uint8Array, x: number, y: number): number` - Get pixel

##### Color Utilities

- `mapRGBToDisplayColor(r: number, g: number, b: number): number` - RGB to display color
- `createBufferFromRGB(rgbBuffer: Uint8Array, width: number, height: number): Uint8Array` - Convert RGB buffer
- `hslToRgb(h: number, s: number, l: number): RGBColor` - HSL to RGB conversion

##### Analysis

- `analyzeColorDistribution(buffer: Uint8Array): ColorDistribution` - Analyze buffer colors

### Color Constants

```typescript
const colors = {
  BLACK: 0,
  WHITE: 1, 
  YELLOW: 2,
  RED: 3,
  BLUE: 5,
  GREEN: 6
};
```

## Examples

### Basic Usage

```typescript
import { EPaperDriver } from "@framink/epaper_driver";

const epd = new EPaperDriver();

epd.init();
epd.clear(epd.colors.WHITE);

// Draw a red rectangle
const buffer = epd.createBuffer(epd.colors.WHITE);
for (let x = 100; x < 200; x++) {
  for (let y = 100; y < 200; y++) {
    epd.setPixel(buffer, x, y, epd.colors.RED);
  }
}

epd.display(buffer);
epd.sleep();
epd.exit();
```

### RGB Image Conversion

```typescript
// Convert RGB image data to display buffer
const rgbData = new Uint8Array(800 * 480 * 3); // Your RGB data
const displayBuffer = epd.createBufferFromRGB(rgbData, 800, 480);
epd.display(displayBuffer);
```

### Color Analysis

```typescript
const buffer = epd.createFullColorTestPattern();
const analysis = epd.analyzeColorDistribution(buffer);

console.log(`Total pixels: ${analysis.totalPixels}`);
console.log(`Unique colors: ${analysis.uniqueColors}`);
console.log(`Color distribution:`, analysis.colors);
```

## Build System

The package uses a Makefile-based build system for the native library:

```bash
make build-rpi      # Build for Raspberry Pi
make build-jetson   # Build for Jetson Nano  
make debug          # Debug build
make clean          # Clean build artifacts
make test-build     # Test build process
```

## Hardware Setup

### Wiring (Raspberry Pi)

| EPD Pin | RPi Pin | Function |
|---------|---------|----------|
| VCC     | 3.3V    | Power    |
| GND     | GND     | Ground   |
| DIN     | GPIO10  | SPI MOSI |
| CLK     | GPIO11  | SPI CLK  |
| CS      | GPIO8   | SPI CS   |
| DC      | GPIO25  | Data/Command |
| RST     | GPIO17  | Reset    |
| BUSY    | GPIO24  | Busy     |

### Permissions

Ensure your user has access to GPIO:

```bash
sudo usermod -a -G gpio $USER
# Log out and back in
```

## Performance

- **FFI Overhead**: ~2-6x faster than Node-API equivalents
- **Memory Usage**: Efficient direct memory access
- **Startup Time**: No compilation step required

## Error Handling

All methods throw descriptive errors for common issues:

- Initialization failures
- Buffer size mismatches  
- Invalid coordinates
- Hardware communication errors

```typescript
try {
  epd.init();
} catch (error) {
  if (error.message.includes('permission')) {
    console.log('Check GPIO permissions');
  }
}
```

## Development

### Building from Source

```bash
git clone <repo>
cd epaper_driver
bun install
make clean && make
bun run build
```

### Running Examples

```bash
# Software tests only
bun run examples/basic.ts

# With hardware tests  
bun run examples/basic.ts --hardware
```

## Compatibility

- **Runtime**: Bun 1.0+, Node.js 14+ (with appropriate FFI polyfills)
- **Platforms**: Linux (Raspberry Pi OS, Ubuntu)
- **Hardware**: Raspberry Pi 3/4/5, Jetson Nano
- **Display**: Waveshare 7.3inch e-Paper (F)

## License

MIT