#!/usr/bin/env bun

import { EPaperDriver } from "../src/index.js";

async function basicExample() {
  console.log("EPaper Driver FFI Example");
  console.log("========================");

  const epd = new EPaperDriver();

  try {
    // Display basic info
    console.log(`Display dimensions: ${epd.width}x${epd.height}`);
    console.log(`Buffer size: ${epd.bufferSize} bytes`);
    console.log(`Driver version: ${epd.version}`);
    console.log(`Available colors:`, epd.colors);

    // Initialize the display
    console.log("\nInitializing display...");
    epd.init();
    console.log("Display initialized successfully!");

    // Clear the display with white
    console.log("\nClearing display with white...");
    epd.clear(epd.colors.WHITE);
    console.log("Display cleared!");

    // Show 7-color block pattern
    console.log("\nDisplaying 7-color block pattern...");
    epd.show7Block();
    console.log("7-color pattern displayed!");

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create a custom buffer with some pixels
    console.log("\nCreating custom image buffer...");
    const buffer = epd.createBuffer(epd.colors.WHITE);
    
    // Draw some colored rectangles
    const rectWidth = Math.floor(epd.width / 6);
    const rectHeight = Math.floor(epd.height / 3);
    const colors = [
      epd.colors.BLACK,
      epd.colors.RED,
      epd.colors.YELLOW,
      epd.colors.GREEN,
      epd.colors.BLUE,
      epd.colors.WHITE
    ];

    for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
      const startX = colorIndex * rectWidth;
      const endX = Math.min(startX + rectWidth, epd.width);
      
      for (let x = startX; x < endX; x++) {
        for (let y = 0; y < rectHeight; y++) {
          epd.setPixel(buffer, x, y, colors[colorIndex]);
        }
      }
    }

    // Display the custom buffer
    console.log("Displaying custom image...");
    epd.display(buffer);
    console.log("Custom image displayed!");

    // Analyze the buffer
    const analysis = epd.analyzeColorDistribution(buffer);
    console.log("\nBuffer analysis:");
    console.log(`Total pixels: ${analysis.totalPixels}`);
    console.log(`Unique colors: ${analysis.uniqueColors}`);
    
    // Wait before sleep
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Put display to sleep
    console.log("\nPutting display to sleep...");
    epd.sleep();
    console.log("Display is now in sleep mode.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Always cleanup
    console.log("\nCleaning up...");
    try {
      epd.exit();
      console.log("Cleanup completed.");
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
  }
}

// RGB to display color example
function testColorMapping() {
  console.log("\nTesting RGB to display color mapping:");
  const epd = new EPaperDriver();
  
  const testColors = [
    { r: 0, g: 0, b: 0, name: "Black" },
    { r: 255, g: 255, b: 255, name: "White" },
    { r: 255, g: 0, b: 0, name: "Red" },
    { r: 0, g: 255, b: 0, name: "Green" },
    { r: 0, g: 0, b: 255, name: "Blue" },
    { r: 255, g: 255, b: 0, name: "Yellow" },
  ];

  for (const color of testColors) {
    const mapped = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
    console.log(`${color.name} (${color.r},${color.g},${color.b}) -> ${mapped}`);
  }
}

// HSL conversion example
function testHSLConversion() {
  console.log("\nTesting HSL to RGB conversion:");
  const epd = new EPaperDriver();
  
  const testHSL = [
    { h: 0, s: 1, l: 0.5, name: "Pure Red" },
    { h: 120, s: 1, l: 0.5, name: "Pure Green" },
    { h: 240, s: 1, l: 0.5, name: "Pure Blue" },
    { h: 60, s: 1, l: 0.5, name: "Pure Yellow" },
    { h: 0, s: 0, l: 0, name: "Black" },
    { h: 0, s: 0, l: 1, name: "White" },
  ];

  for (const hsl of testHSL) {
    const rgb = epd.hslToRgb(hsl.h, hsl.s, hsl.l);
    console.log(`${hsl.name} HSL(${hsl.h},${hsl.s},${hsl.l}) -> RGB(${rgb.r},${rgb.g},${rgb.b})`);
  }
}

// Run the examples
if (import.meta.main) {
  console.log("Starting EPaper Driver examples...\n");
  
  // Run color mapping tests (these don't require hardware)
  testColorMapping();
  testHSLConversion();
  
  // Check if we should run hardware tests
  const runHardwareTests = process.argv.includes("--hardware");
  
  if (runHardwareTests) {
    console.log("\nRunning hardware tests...");
    await basicExample();
  } else {
    console.log("\nSkipping hardware tests. Use --hardware flag to run them.");
    console.log("Note: Hardware tests require actual EPD hardware and appropriate permissions.");
  }
  
  console.log("\nExample completed!");
}