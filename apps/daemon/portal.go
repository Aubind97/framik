package main

import (
	_ "embed"
	"errors"
	"html/template"
	"log/slog"
	"net/http"
	"time"
)

//go:embed portal.html
var portalHTML string

var portalTmpl = template.Must(template.New("portal").Parse(portalHTML))

type portalPage struct {
	SSIDs      []string
	Error      string
	Connecting string
	Hotspot    string
}

// Every path serves the form: phones probing for a captive portal get it instead of their expected reply and open it.
func startPortal() *http.Server {
	render := func(w http.ResponseWriter, status int, p portalPage) {
		p.Hotspot = hotspotSSID
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(status)
		portalTmpl.Execute(w, p)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /connect", func(w http.ResponseWriter, r *http.Request) {
		ssid, password := r.FormValue("ssid"), r.FormValue("password")
		if len(ssid) == 0 || len(ssid) > 32 || (password != "" && (len(password) < 8 || len(password) > 63)) {
			render(w, http.StatusBadRequest, portalPage{Error: "The network name must be 1-32 characters and the password 8-63."})
			return
		}
		render(w, http.StatusOK, portalPage{Connecting: ssid})
		go connectWifi(ssid, password)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, _ *http.Request) {
		netMu.Lock()
		p := portalPage{SSIDs: setupState.ssids, Error: setupState.lastErr}
		netMu.Unlock()
		render(w, http.StatusOK, p)
	})

	srv := &http.Server{Addr: ":80", Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	go func() {
		if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			slog.Error("setup portal stopped", "err", err)
		}
	}()
	return srv
}
