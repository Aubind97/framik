package main

import (
	"image"
	"image/color"
)

// The web app dithers to these exact colours; anything else becomes white, like Waveshare's driver.
var panelColors = map[color.RGBA]byte{
	{0, 0, 0, 255}:       0x0,
	{255, 255, 255, 255}: white,
	{255, 255, 0, 255}:   0x2,
	{255, 0, 0, 255}:     0x3,
	{0, 0, 255, 255}:     0x5,
	{0, 255, 0, 255}:     0x6,
}

// pack converts an 800x480 image to the panel buffer: 4 bits per pixel, left pixel in the high nibble.
func pack(img image.Image) []byte {
	buf := make([]byte, bufSize)
	b := img.Bounds()
	for y := range height {
		for x := range width {
			r, g, bl, _ := img.At(b.Min.X+x, b.Min.Y+y).RGBA()
			c, ok := panelColors[color.RGBA{uint8(r >> 8), uint8(g >> 8), uint8(bl >> 8), 255}]
			if !ok {
				c = white
			}
			buf[(y*width+x)/2] |= c << (4 * (1 - x%2))
		}
	}
	return buf
}
