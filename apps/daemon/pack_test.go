package main

import (
	"image"
	"image/color"
	"testing"
)

func TestPack(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for i := range img.Pix {
		img.Pix[i] = 255
	}
	img.Set(0, 0, color.RGBA{255, 0, 0, 255})       // red, high nibble
	img.Set(1, 0, color.RGBA{0, 255, 0, 255})       // green, low nibble
	img.Set(2, 0, color.RGBA{0, 0, 0, 255})         // black
	img.Set(3, 0, color.RGBA{191, 0, 0, 255})       // measured red, not a driver colour -> white
	img.Set(width-1, height-1, color.RGBA{0, 0, 255, 255})

	buf := pack(img)
	if len(buf) != 192000 {
		t.Fatalf("len = %d", len(buf))
	}
	for i, want := range map[int]byte{0: 0x36, 1: 0x01, 2: 0x11, bufSize - 1: 0x15} {
		if buf[i] != want {
			t.Errorf("buf[%d] = %#x, want %#x", i, buf[i], want)
		}
	}
}
