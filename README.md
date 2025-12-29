# API Monitor (Laravel + Uptime Kuma)

This project periodically fetches Prometheus-format metrics from an Uptime Kuma instance, parses key monitor metrics, and persists them in a database for dashboard visualization (Inertia + React planned).

It uses a queued job (with retry/backoff) and can optionally run with Laravel Horizon (Redis) for queue management and observability.

## Overview

- Fetch Kuma metrics from `/metrics` (Basic Auth: empty username, API key as password)
- Persist one row per monitor per fetch (`fetched_at` timestamp)
- Rich repository queries ready for dashboards
- Queue isolation on `kuma` (works with or without Horizon)

## Quick Start

1) Install and bootstrap

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
```

2) Minimal .env

```ini
UPTIME_KUMA_URL=http://192.168.1.3:3444
UPTIME_KUMA_API_KEY=your_kuma_token

# Choose a queue driver
# QUEUE_CONNECTION=redis   # for Redis + Horizon
QUEUE_CONNECTION=database  # without Redis/Horizon

# Enable WebSocket broadcasting with Laravel Reverb (for Dashboard realtime)
BROADCAST_DRIVER=reverb

# Reverb server (local dev defaults)
REVERB_APP_ID=local
REVERB_APP_KEY=local-app-key
REVERB_APP_SECRET=local-app-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_PATH=

# Vite client (Dashboard subscribes to these)
VITE_REVERB_ENABLED=true
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
VITE_REVERB_PATH="${REVERB_PATH}"
```

3) Run

- One command (includes server, scheduler, queue worker, Vite, and Reverb WS):
  - `composer dev`

- With Redis + Horizon (alternative manual):
  - `php artisan serve` + `php artisan schedule:work` + `php artisan horizon` + `php artisan reverb:start` + `npm run dev`

- Without Redis (no Horizon):
  - `php artisan serve` + `php artisan schedule:work` + `php artisan queue:work --queue=kuma,default` + `php artisan reverb:start` + `npm run dev`

- Trigger a fetch: `php artisan kuma:fetch` (scheduler also runs it every minute)

4) WebSocket behavior (Reverb)

- Only the Dashboard page uses WebSockets for realtime updates. Reports pages do not open WS connections.
- After each scheduled fetch, the backend emits a tiny "tick" event per range (24h, 7d, 30d) on channels:
  - `dashboard.metrics.24h`, `dashboard.metrics.7d`, `dashboard.metrics.30d`
- The Dashboard listens to `.dashboard.data` and then fetches the latest JSON payload via `/dashboard/data?range=...`.
- This avoids large WS payloads and keeps resource usage low.

Common ports/URLs (dev):
- App: http://127.0.0.1:8000
- Reverb WS: ws://127.0.0.1:8080

## Scheduling (Production)

```cron
* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
```

## Documentation

For detailed configuration, service/command/job behavior, queue/Horizon setup, data model and indexes, repository query catalog, and troubleshooting, see:

- [Uptime Kuma Integration Guide](docs/uptime-kuma.md)
- [Container guide](docs/docker.md)

## Docker

Spin up the full stack (app HTTP server, scheduler, queue, Reverb WS, Vite, MySQL, Redis) with Docker:

```bash
APP_PORT=8000 docker compose up --build
```

For a production-style image (code baked into the image, no bind mounts) use the override file:

```bash
APP_URL=https://monitor.example.com \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

More usage details live in [docs/docker.md](docs/docker.md).

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
