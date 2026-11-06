package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

const (
	hotspotCon = "framik-hotspot"
	// NetworkManager's default address for a shared (hotspot) connection
	portalURL = "http://10.42.0.1"
)

var (
	hotspotSSID, hotspotPassword = hotspotCredentials()

	setupOn atomic.Bool
	// netMu serialises hotspot and connection changes, and guards setupState
	netMu      sync.Mutex
	setupState struct {
		ssids   []string
		lastErr string
		portal  *http.Server
	}
)

// Derived from the machine id so the QR code stays valid across reboots without a state file.
func hotspotCredentials() (ssid, password string) {
	id, _ := os.ReadFile("/etc/machine-id")
	sum := sha256.Sum256(append([]byte("framik"), id...))
	h := hex.EncodeToString(sum[:])
	return "Framik-" + strings.ToUpper(h[:4]), h[4:12]
}

// ponytail: no escaping, fine while SSID and password are [A-Za-z0-9-]; escape \ ; , : " if they ever become user-defined
func wifiQR() string {
	return "WIFI:T:WPA;S:" + hotspotSSID + ";P:" + hotspotPassword + ";;"
}

func nmcli(args ...string) (string, error) {
	out, err := exec.Command("nmcli", args...).CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("nmcli %s: %w: %s", strings.Join(args, " "), err, bytes.TrimSpace(out))
	}
	return string(out), nil
}

// nmcli -t escapes ':' and '\' inside values
var terseUnescaper = strings.NewReplacer(`\:`, ":", `\\`, `\`)

func online() bool {
	out, err := nmcli("-t", "-f", "TYPE,STATE,NAME", "connection", "show", "--active")
	if err != nil {
		slog.Warn("cannot read network state, assuming online", "err", err)
		return true
	}
	for line := range strings.Lines(out) {
		f := strings.SplitN(strings.TrimSpace(line), ":", 3)
		if len(f) == 3 && (f[0] == "802-11-wireless" || f[0] == "802-3-ethernet") && f[1] == "activated" && f[2] != hotspotCon {
			return true
		}
	}
	return false
}

func hasSavedWifi() bool {
	out, _ := nmcli("-t", "-f", "TYPE,NAME", "connection", "show")
	for line := range strings.Lines(out) {
		typ, name, _ := strings.Cut(strings.TrimSpace(line), ":")
		if typ == "802-11-wireless" && name != hotspotCon {
			return true
		}
	}
	return false
}

// The radio cannot scan while it runs the hotspot, so scan before starting it.
func scanWifi() []string {
	out, err := nmcli("-t", "-f", "SSID", "device", "wifi", "list", "--rescan", "yes")
	if err != nil {
		slog.Warn("wifi scan failed", "err", err)
	}
	var ssids []string
	seen := map[string]bool{}
	for line := range strings.Lines(out) {
		ssid := terseUnescaper.Replace(strings.TrimRight(line, "\n"))
		if ssid != "" && !seen[ssid] {
			seen[ssid] = true
			ssids = append(ssids, ssid)
		}
	}
	return ssids
}

func startHotspot() error {
	_, err := nmcli("device", "wifi", "hotspot", "ifname", "wlan0", "con-name", hotspotCon, "ssid", hotspotSSID, "password", hotspotPassword)
	return err
}

func stopHotspot() {
	nmcli("connection", "down", hotspotCon)
}

func localIP() string {
	addrs, _ := net.InterfaceAddrs()
	for _, a := range addrs {
		if ip, ok := a.(*net.IPNet); ok && ip.IP.To4() != nil && !ip.IP.IsLoopback() {
			return ip.IP.String()
		}
	}
	return "unknown"
}

// showBlocking waits for the frame instead of rejecting like the HTTP routes: setup screens must not be dropped.
func showBlocking(clearFirst bool, img []byte) {
	frameMu.Lock()
	defer func() {
		lastUpdate.Store(time.Now().UnixNano())
		frameMu.Unlock()
	}()
	time.Sleep(minUpdateInterval - time.Since(time.Unix(0, lastUpdate.Load())))
	if err := updatePanel(clearFirst, img); err != nil {
		slog.Error("frame update failed", "err", err)
	}
}

func setupImage() []byte {
	if img, err := loadCurrent(); err == nil {
		return pack(withBanner(img))
	}
	return pack(setupScreen())
}

func enterSetup() {
	netMu.Lock()
	defer netMu.Unlock()
	slog.Info("offline: starting wifi setup", "ssid", hotspotSSID)
	setupState.ssids = scanWifi()
	if err := startHotspot(); err != nil {
		slog.Error("cannot start hotspot", "err", err)
		return
	}
	setupState.portal = startPortal()
	setupOn.Store(true)
	showBlocking(false, setupImage())
}

// leaveSetup expects netMu to be held.
func leaveSetup() {
	slog.Info("online: leaving wifi setup")
	stopHotspot()
	if setupState.portal != nil {
		setupState.portal.Close()
		setupState.portal = nil
	}
	setupOn.Store(false)
	if img, err := loadCurrent(); err == nil {
		showBlocking(false, pack(img))
	} else {
		showBlocking(false, pack(connectedScreen("http://"+localIP()+":3000")))
	}
}

func connectWifi(ssid, password string) {
	netMu.Lock()
	defer netMu.Unlock()
	if !setupOn.Load() {
		return
	}
	stopHotspot()
	args := []string{"device", "wifi", "connect", ssid, "ifname", "wlan0"}
	if password != "" {
		args = append(args, "password", password)
	}
	if _, err := nmcli(args...); err != nil {
		slog.Warn("wifi connect failed", "ssid", ssid, "err", err)
		setupState.lastErr = "Could not connect to " + ssid + ". Check the password and try again."
		if err := startHotspot(); err != nil {
			slog.Error("cannot restart hotspot", "err", err)
		}
		return
	}
	setupState.lastErr = ""
	leaveSetup()
}

// Give saved networks a chance, so a router reboot does not leave the frame stuck in hotspot mode.
func retryKnown() {
	netMu.Lock()
	defer netMu.Unlock()
	slog.Info("setup: retrying saved networks")
	stopHotspot()
	time.Sleep(45 * time.Second)
	if online() {
		leaveSetup()
		return
	}
	setupState.ssids = scanWifi()
	if err := startHotspot(); err != nil {
		slog.Error("cannot restart hotspot", "err", err)
	}
}

func watchNetwork() {
	offline := 0
	var lastRetry time.Time
	for range time.Tick(time.Minute) {
		if online() {
			offline = 0
			if setupOn.Load() {
				netMu.Lock()
				leaveSetup()
				netMu.Unlock()
			}
			continue
		}
		offline++
		switch {
		case !setupOn.Load() && offline >= 3:
			enterSetup()
			lastRetry = time.Now()
		case setupOn.Load() && time.Since(lastRetry) > 10*time.Minute && hasSavedWifi():
			retryKnown()
			lastRetry = time.Now()
		}
	}
}
