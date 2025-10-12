# Advanced Dithering Guide

This guide explains how to use the improved `applyDithering` function for optimal results with e-ink displays and other limited-color output devices.

## Quick Start

```typescript
import { applyDithering, type Color } from './dithering';

// Basic black and white dithering
const palette: Color[] = [
  { r: 0, g: 0, b: 0 },       // Black
  { r: 255, g: 255, b: 255 }  // White
];

const dithered = applyDithering(imageData, palette);
```

## Key Improvements

The improved dithering function includes several enhancements over basic implementations:

1. **Perceptual Color Matching** - Uses human vision-based color distance calculations
2. **Error Clamping** - Prevents overflow artifacts that cause banding
3. **Local Contrast Enhancement** - Preserves fine details better
4. **Palette Optimization** - Automatically finds optimal colors for your image
5. **Advanced Algorithms** - Including Stucki algorithm optimized for e-ink

## Algorithm Comparison

| Algorithm | Quality | Speed | Best For |
|-----------|---------|-------|----------|
| `stucki` | ★★★★★ | ★★☆☆☆ | E-ink displays, photos |
| `sierra` | ★★★★☆ | ★★★☆☆ | General purpose, balanced |
| `sierra-two-row` | ★★★☆☆ | ★★★★☆ | Fast processing needed |
| `floyd-steinberg` | ★★★☆☆ | ★★★★☆ | Fine details, line art |
| `atkinson` | ★★☆☆☆ | ★★★★★ | Vintage/artistic effects |

## Usage Examples

### High-Quality E-ink Dithering

```typescript
const options = {
  algorithm: 'stucki',              // Best quality for e-ink
  usePerceptualSpace: true,         // Most accurate color matching
  errorClamping: true,              // Prevent artifacts
  contrastEnhancement: 0.2,         // Subtle detail enhancement
  serpentine: true                  // Better error distribution
};

const result = applyDithering(imageData, palette, options);
```

### Fast Processing with Good Quality

```typescript
const options = {
  algorithm: 'sierra-two-row',      // Good balance
  errorClamping: true,              // Still prevent artifacts
  contrastEnhancement: 0.1          // Light enhancement
};

const result = applyDithering(imageData, palette, options);
```

### Automatic Palette Optimization

```typescript
// Let the algorithm find the best colors for your image
const options = {
  optimizePalette: true,            // Find optimal colors
  algorithm: 'stucki',
  usePerceptualSpace: true
};

// Start with any colors - they'll be optimized
const roughPalette = [
  { r: 0, g: 0, b: 0 },
  { r: 128, g: 128, b: 128 },
  { r: 255, g: 255, b: 255 }
];

const result = applyDithering(imageData, roughPalette, options);
```

### Custom Color Distance

```typescript
import { perceptualColorDistance, manhattanColorDistance } from './dithering';

// Use built-in perceptual distance (recommended)
const options1 = {
  colorDistance: perceptualColorDistance
};

// Use faster but less accurate Manhattan distance
const options2 = {
  colorDistance: manhattanColorDistance
};
```

## Common Palettes

### E-ink Display (Black & White)
```typescript
const bwPalette = [
  { r: 0, g: 0, b: 0 },
  { r: 255, g: 255, b: 255 }
];
```

### E-ink with Gray (3-color)
```typescript
const grayPalette = [
  { r: 0, g: 0, b: 0 },
  { r: 128, g: 128, b: 128 },
  { r: 255, g: 255, b: 255 }
];
```

### Game Boy Green
```typescript
const gameboyPalette = [
  { r: 15, g: 56, b: 15 },
  { r: 48, g: 98, b: 48 },
  { r: 139, g: 172, b: 15 },
  { r: 155, g: 188, b: 15 }
];
```

### Retro CGA
```typescript
const cgaPalette = [
  { r: 0, g: 0, b: 0 },
  { r: 0, g: 170, b: 170 },
  { r: 170, g: 0, b: 170 },
  { r: 170, g: 170, b: 170 }
];
```

## Performance Tips

1. **Use `sierra-two-row` for real-time processing** - Good quality with better performance
2. **Enable `errorClamping`** - Prevents artifacts with minimal performance cost  
3. **Limit `contrastEnhancement`** - Values above 0.3 can be slow and may over-enhance
4. **Sample large images** - For palette optimization on huge images, consider downsampling first
5. **Cache palettes** - If using `optimizePalette`, save the results for reuse

## Troubleshooting

### Banding or Artifacts
- Enable `errorClamping: true`
- Try the `stucki` algorithm for smoother gradients
- Reduce `contrastEnhancement` value

### Colors Look Wrong
- Use `usePerceptualSpace: true` for better color matching
- Try `perceptualColorDistance` instead of `manhattanColorDistance`
- Consider palette optimization with `optimizePalette: true`

### Too Slow
- Switch to `sierra-two-row` or `floyd-steinberg`
- Disable `usePerceptualSpace`
- Reduce `contrastEnhancement` or set to 0
- Don't use `optimizePalette` for every image

### Loss of Detail
- Increase `contrastEnhancement` (try 0.1-0.3)
- Use `stucki` or `sierra` algorithms
- Enable `serpentine: true`

## Advanced Usage

### Preprocessing Images
```typescript
// For very dark or bright images, adjust gamma first
const options = {
  gamma: 0.8,  // Brighten dark images
  // gamma: 1.2   // Darken bright images
  contrastEnhancement: 0.2
};
```

### Custom Error Distribution
The library supports custom dithering algorithms. Each algorithm distributes quantization error differently:

- **Atkinson**: Preserves highlights, good for line art
- **Floyd-Steinberg**: Classic, good for details  
- **Sierra**: Balanced, smooth gradients
- **Sierra Two-Row**: Faster Sierra variant
- **Stucki**: Highest quality, smoothest results

Choose based on your specific needs and performance requirements.

## Integration with Canvas

```typescript
// Get ImageData from canvas
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Apply dithering
const dithered = applyDithering(imageData, palette, {
  algorithm: 'stucki',
  usePerceptualSpace: true,
  errorClamping: true
});

// Put back to canvas
ctx.putImageData(dithered, 0, 0);
```

This improved dithering implementation should give you significantly better results, especially for e-ink displays and other limited-color output devices.