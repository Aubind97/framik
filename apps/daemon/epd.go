package main

import (
	"bytes"
	"errors"
	"os"
	"time"

	"github.com/warthog618/go-gpiocdev"
	"golang.org/x/sys/unix"
)

// Port of Waveshare's EPD_7in3e.c (7.3" e-Paper E6) over spidev and the GPIO chardev.

const (
	width   = 800
	height  = 480
	bufSize = width / 2 * height
	white   = 0x1

	spiIOCWrMaxSpeedHz = 0x40046B04 // _IOW('k', 4, __u32)
	spiChunk           = 4096       // spidev default bufsiz
)

type epd struct {
	spi                    *os.File
	rst, dc, pwr, busy, cs *gpiocdev.Line
	err                    error
}

func requestLine(name string, opt gpiocdev.LineReqOption) (*gpiocdev.Line, error) {
	chip, offset, err := gpiocdev.FindLine(name)
	if err != nil {
		return nil, err
	}
	return gpiocdev.RequestLine(chip, offset, opt, gpiocdev.WithConsumer("framik"))
}

func openEPD() (e *epd, err error) {
	e = &epd{}
	defer func() {
		if err != nil {
			e.close()
		}
	}()
	if e.rst, err = requestLine("GPIO17", gpiocdev.AsOutput(0)); err != nil {
		return
	}
	if e.dc, err = requestLine("GPIO25", gpiocdev.AsOutput(0)); err != nil {
		return
	}
	if e.pwr, err = requestLine("GPIO18", gpiocdev.AsOutput(1)); err != nil {
		return
	}
	if e.busy, err = requestLine("GPIO24", gpiocdev.AsInput); err != nil {
		return
	}
	// CE0 is normally owned by spidev; drive it by hand only when the kernel left it free
	e.cs, _ = requestLine("GPIO8", gpiocdev.AsOutput(1))
	if e.spi, err = os.OpenFile("/dev/spidev0.0", os.O_WRONLY, 0); err != nil {
		return
	}
	err = unix.IoctlSetPointerInt(int(e.spi.Fd()), spiIOCWrMaxSpeedHz, 10_000_000)
	return
}

func (e *epd) close() {
	if e.spi != nil {
		e.spi.Close()
	}
	for _, l := range []*gpiocdev.Line{e.cs, e.pwr, e.dc, e.rst} {
		if l != nil {
			l.SetValue(0)
			l.Close()
		}
	}
	if e.busy != nil {
		e.busy.Close()
	}
}

func (e *epd) write(dc int, b []byte) {
	if e.err != nil {
		return
	}
	e.dc.SetValue(dc)
	if e.cs != nil {
		e.cs.SetValue(0)
		defer e.cs.SetValue(1)
	}
	for len(b) > 0 {
		n := min(len(b), spiChunk)
		if _, e.err = e.spi.Write(b[:n]); e.err != nil {
			return
		}
		b = b[n:]
	}
}

func (e *epd) cmd(c byte, data ...byte) {
	e.write(0, []byte{c})
	if len(data) > 0 {
		e.write(1, data)
	}
}

// BUSY is low while the panel works
func (e *epd) waitBusy() {
	deadline := time.Now().Add(60 * time.Second)
	for e.err == nil {
		v, err := e.busy.Value()
		switch {
		case err != nil:
			e.err = err
		case v == 1:
			return
		case time.Now().After(deadline):
			e.err = errors.New("e-paper busy timeout")
		default:
			time.Sleep(time.Millisecond)
		}
	}
}

func (e *epd) init() {
	for _, step := range []struct {
		v int
		d time.Duration
	}{{1, 20}, {0, 2}, {1, 20}} {
		e.rst.SetValue(step.v)
		time.Sleep(step.d * time.Millisecond)
	}
	e.waitBusy()
	time.Sleep(30 * time.Millisecond)

	e.cmd(0xAA, 0x49, 0x55, 0x20, 0x08, 0x09, 0x18)
	e.cmd(0x01, 0x3F)
	e.cmd(0x00, 0x5F, 0x69)
	e.cmd(0x03, 0x00, 0x54, 0x00, 0x44)
	e.cmd(0x05, 0x40, 0x1F, 0x1F, 0x2C)
	e.cmd(0x06, 0x6F, 0x1F, 0x17, 0x49)
	e.cmd(0x08, 0x6F, 0x1F, 0x1F, 0x22)
	e.cmd(0x30, 0x03)
	e.cmd(0x50, 0x3F)
	e.cmd(0x60, 0x02, 0x00)
	e.cmd(0x61, 0x03, 0x20, 0x01, 0xE0)
	e.cmd(0x84, 0x01)
	e.cmd(0xE3, 0x2F)
	e.cmd(0x04)
	e.waitBusy()
}

func (e *epd) display(buf []byte) {
	e.cmd(0x10, buf...)
	e.cmd(0x04)
	e.waitBusy()
	e.cmd(0x06, 0x6F, 0x1F, 0x17, 0x49)
	e.cmd(0x12, 0x00)
	e.waitBusy()
	e.cmd(0x02, 0x00)
	e.waitBusy()
}

func (e *epd) sleep() {
	e.cmd(0x02, 0x00)
	e.waitBusy()
	e.cmd(0x07, 0xA5)
}

// epdUpdate wakes the panel, optionally clears it to white, shows buf (if any) and puts it back to deep sleep.
func epdUpdate(clearFirst bool, buf []byte) error {
	e, err := openEPD()
	if err != nil {
		return err
	}
	defer e.close()
	e.init()
	if clearFirst {
		e.display(bytes.Repeat([]byte{white<<4 | white}, bufSize))
	}
	if buf != nil {
		e.display(buf)
	}
	e.sleep()
	return e.err
}
