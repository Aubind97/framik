package main

import (
	"image"
	"image/draw"
	"log/slog"

	"github.com/skip2/go-qrcode"
	"golang.org/x/image/font"
	"golang.org/x/image/font/gofont/gobold"
	"golang.org/x/image/font/gofont/goregular"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
)

var (
	regular = mustParse(goregular.TTF)
	bold    = mustParse(gobold.TTF)
)

func mustParse(ttf []byte) *opentype.Font {
	f, err := opentype.Parse(ttf)
	if err != nil {
		panic(err)
	}
	return f
}

func face(f *opentype.Font, size float64) font.Face {
	face, err := opentype.NewFace(f, &opentype.FaceOptions{Size: size, DPI: 72, Hinting: font.HintingFull})
	if err != nil {
		panic(err)
	}
	return face
}

// card is a white canvas for black text and QR codes, thresholded to pure black and white for the panel.
type card struct{ *image.RGBA }

func newCard(w, h int) card {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	draw.Draw(img, img.Bounds(), image.White, image.Point{}, draw.Src)
	return card{img}
}

func (c card) text(f *opentype.Font, size float64, x, y int, s string) {
	d := font.Drawer{Dst: c.RGBA, Src: image.Black, Face: face(f, size), Dot: fixed.P(x, y)}
	d.DrawString(s)
}

func (c card) qr(content string, x, y, size int) {
	q, err := qrcode.New(content, qrcode.Medium)
	if err != nil {
		slog.Error("qr code", "err", err)
		return
	}
	q.DisableBorder = true
	bm := q.Bitmap()
	s := size / len(bm)
	for r, row := range bm {
		for col, on := range row {
			if on {
				draw.Draw(c.RGBA, image.Rect(x+col*s, y+r*s, x+(col+1)*s, y+(r+1)*s), image.Black, image.Point{}, draw.Src)
			}
		}
	}
}

func (c card) done() *image.RGBA {
	for i := 0; i < len(c.Pix); i += 4 {
		v := byte(255)
		if int(c.Pix[i])+int(c.Pix[i+1])+int(c.Pix[i+2]) < 3*128 {
			v = 0
		}
		c.Pix[i], c.Pix[i+1], c.Pix[i+2], c.Pix[i+3] = v, v, v, 255
	}
	return c.RGBA
}

func setupScreen() image.Image {
	c := newCard(width, height)
	c.qr(wifiQR(), 40, 95, 300)
	const x = 380
	c.text(bold, 40, x, 110, "Framik setup")
	c.text(regular, 24, x, 170, "1. Scan the QR code to join")
	c.text(regular, 24, x, 200, "    the frame's Wi-Fi")
	c.text(bold, 24, x, 240, hotspotSSID)
	c.text(regular, 24, x, 272, "Password: "+hotspotPassword)
	c.text(regular, 24, x, 330, "2. Pick your network on the page")
	c.text(regular, 24, x, 360, "    that opens, or go to")
	c.text(bold, 24, x, 398, portalURL)
	return c.done()
}

func withBanner(photo image.Image) image.Image {
	const h, pad, qr, label = 112, 12, 88, "Offline · scan to set up Wi-Fi"
	w := pad + qr + pad + font.MeasureString(face(bold, 20), label).Round() + pad
	c := newCard(w, h)
	c.qr(wifiQR(), pad, pad, qr)
	c.text(bold, 20, pad+qr+pad, h/2+7, label)

	out := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.Draw(out, out.Bounds(), photo, photo.Bounds().Min, draw.Src)
	draw.Draw(out, image.Rect(0, height-h, w, height), c.done(), image.Point{}, draw.Src)
	return out
}

func connectedScreen(addr string) image.Image {
	c := newCard(width, height)
	c.text(bold, 40, 60, 200, "Frame connected")
	c.text(regular, 24, 60, 250, "Add it in Framik with this address:")
	c.text(bold, 32, 60, 300, addr)
	return c.done()
}
