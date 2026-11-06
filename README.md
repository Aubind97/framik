# Framik
> Use an epaper screen as a beautiful frame. Show photos, widgets (calendar, weather, ...)

![Framik logo](./assets/repo_thumbnail.png)

## Requirements

**Main server machine**

- bun `curl -fsSL https://bun.sh/install | bash`

> Useful alias
> ```sh
> alias framik_stop='pid=$(lsof -ti tcp:4173); [ "$pid" ] && kill -9 "$pid" || echo "Nothing to kill on port 4173"'
> alias framik_start="cd $HOME/framik/apps/web && nohup bun start > "logs/log_$(date +%Y%m%d_%H%M%S).log" 2>&1 &"
> alias framik_build="cd $HOME/framik && bun i --ignore-scripts --filter ./apps/web && bunx turbo build --filter@framik/web --force"
> ```

**Daemon machine** (Raspberry Pi, 64-bit Pi OS Bookworm)

- SPI enabled: `sudo raspi-config nonint do_spi 0`
- Nothing else: the daemon is a single static Go binary, built on your machine.

**Deploy the daemon** (needs [Go](https://go.dev/dl/) on your machine)

```sh
# On your machine
cd apps/daemon && bun run build
scp dist/framik-daemon framik-daemon.service pi@<frame>:

# On the Pi
sudo install -m755 framik-daemon /usr/local/bin/
sudo cp framik-daemon.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now framik-daemon
journalctl -u framik-daemon -f
```

Update: rebuild, `scp` the binary, `sudo install …` again, then `sudo systemctl restart framik-daemon`.
The current image lives in `/var/lib/framik/current.png`.

## Setup project
```bash
# Install dependencies
bun i
# Run database migration
cd apps/web && bun db:push
# Start the dev server (the daemon needs Go)
bun dev
```

## Useful tools
- API call can be done using [Yaak](https://yaak.app/) by loading the yaak folder as a workspace
