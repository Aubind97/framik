package main

import (
	"image"
	"image/color"
	"image/draw"
	"regexp"
	"testing"
)

func TestWifiQR(t *testing.T) {
	if !regexp.MustCompile(`^WIFI:T:WPA;S:Framik-[0-9A-F]{4};P:[0-9a-f]{8};;$`).MatchString(wifiQR()) {
		t.Errorf("wifiQR() = %q", wifiQR())
	}
}

func assertBlackAndWhite(t *testing.T, img image.Image, r image.Rectangle) {
	t.Helper()
	black := 0
	for y := r.Min.Y; y < r.Max.Y; y++ {
		for x := r.Min.X; x < r.Max.X; x++ {
			switch img.At(x, y).(color.RGBA) {
			case color.RGBA{0, 0, 0, 255}:
				black++
			case color.RGBA{255, 255, 255, 255}:
			default:
				t.Fatalf("pixel %d,%d = %v, not pure black or white", x, y, img.At(x, y))
			}
		}
	}
	if black == 0 {
		t.Fatal("nothing drawn")
	}
}

func TestScreens(t *testing.T) {
	full := image.Rect(0, 0, width, height)
	assertBlackAndWhite(t, setupScreen(), full)
	assertBlackAndWhite(t, connectedScreen("http://192.168.1.20:3000"), full)

	red := color.RGBA{255, 0, 0, 255}
	photo := image.NewRGBA(full)
	draw.Draw(photo, full, image.NewUniform(red), image.Point{}, draw.Src)
	banner := withBanner(photo)
	if banner.Bounds() != full {
		t.Fatalf("bounds = %v", banner.Bounds())
	}
	assertBlackAndWhite(t, banner, image.Rect(0, height-112, 100, height))
	if banner.At(width-1, 0) != red {
		t.Error("photo not kept outside the banner")
	}
}
