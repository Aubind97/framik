package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"image"
	"image/png"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"sync/atomic"
	"time"
)

const (
	currentImage = "current.png"
	// Updating the panel more often risks burn-in
	minUpdateInterval = 15 * time.Second
	// The panel must be refreshed at least every 24h to keep its integrity
	heartbeat = 12 * time.Hour
)

var (
	// Set at build time with -ldflags "-X main.version=..."
	version     = "dev"
	updatePanel = epdUpdate
	frameMu     sync.Mutex
	lastUpdate  atomic.Int64
)

func withFrameLock(task func() error) (bool, error) {
	if !frameMu.TryLock() {
		return false, nil
	}
	defer func() {
		lastUpdate.Store(time.Now().UnixNano())
		frameMu.Unlock()
	}()
	return true, task()
}

func runLocked(w http.ResponseWriter, task func() error) {
	ok, err := withFrameLock(task)
	switch {
	case !ok:
		http.Error(w, "Conflict", http.StatusConflict)
	case err != nil:
		slog.Error("frame update failed", "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func rateLimited(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if time.Since(time.Unix(0, lastUpdate.Load())) < minUpdateInterval {
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}
		h(w, r)
	}
}

func loadCurrent() (image.Image, error) {
	f, err := os.Open(currentImage)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return png.Decode(f)
}

func refresh() error {
	img, err := loadCurrent()
	if err != nil {
		slog.Info("no image to reload", "err", err)
		return nil
	}
	if setupOn.Load() {
		img = withBanner(img)
	}
	return updatePanel(true, pack(img))
}

func push(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Base64Img string `json:"base64Img"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 20<<20)).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	raw, err := base64.StdEncoding.DecodeString(body.Base64Img)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	img, err := png.Decode(bytes.NewReader(raw))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if img.Bounds().Dx() != width || img.Bounds().Dy() != height {
		http.Error(w, "image must be 800x480", http.StatusBadRequest)
		return
	}
	slog.Info("image received")
	runLocked(w, func() error {
		// Write then rename so a power cut never leaves a truncated image behind
		if err := os.WriteFile(currentImage+".tmp", raw, 0o644); err != nil {
			return err
		}
		if err := os.Rename(currentImage+".tmp", currentImage); err != nil {
			return err
		}
		return updatePanel(false, pack(img))
	})
}

func current(w http.ResponseWriter, _ *http.Request) {
	raw, err := os.ReadFile(currentImage)
	if errors.Is(err, os.ErrNotExist) {
		http.NotFound(w, nil)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte("data:image/png;base64," + base64.StdEncoding.EncodeToString(raw)))
}

func main() {
	if os.Getenv("SKIP_FRAME_UPDATE") == "true" {
		slog.Info("SKIP_FRAME_UPDATE: panel calls are skipped (the frame can only be driven from a Raspberry Pi)")
		updatePanel = func(clearFirst bool, buf []byte) error {
			slog.Info("skipped panel update", "clear", clearFirst, "image", buf != nil)
			return nil
		}
	} else {
		go watchNetwork()
	}

	go func() {
		for range time.Tick(heartbeat) {
			if time.Since(time.Unix(0, lastUpdate.Load())) > heartbeat {
				slog.Info("heartbeat refresh")
				if _, err := withFrameLock(refresh); err != nil {
					slog.Error("heartbeat refresh failed", "err", err)
				}
			}
		}
	}()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /frame/push", rateLimited(push))
	mux.HandleFunc("POST /frame/refresh", rateLimited(func(w http.ResponseWriter, _ *http.Request) { runLocked(w, refresh) }))
	mux.HandleFunc("POST /frame/clear", rateLimited(func(w http.ResponseWriter, _ *http.Request) {
		runLocked(w, func() error { return updatePanel(true, nil) })
	}))
	mux.HandleFunc("GET /frame/current", current)
	mux.HandleFunc("GET /status", func(w http.ResponseWriter, _ *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{"online": true, "version": version})
	})

	srv := &http.Server{Addr: ":3000", Handler: mux, ReadHeaderTimeout: 30 * time.Second, IdleTimeout: 30 * time.Second}
	slog.Info("server running", "addr", srv.Addr)
	if err := srv.ListenAndServe(); err != nil {
		slog.Error("server stopped", "err", err)
		os.Exit(1)
	}
}
