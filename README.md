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
```

2) Minimal .env

```ini
UPTIME_KUMA_URL=http://192.168.1.3:3444
UPTIME_KUMA_API_KEY=your_kuma_token

# Choose a queue driver
# QUEUE_CONNECTION=redis   # for Redis + Horizon
QUEUE_CONNECTION=database  # without Redis/Horizon
```

3) Run

- With Redis + Horizon:
  - `php artisan serve` and `php artisan horizon` (UI at `/horizon`)

- Without Redis (no Horizon):
  - `php artisan serve` and `php artisan queue:work --queue=kuma`

- Trigger a fetch: `php artisan kuma:fetch` (scheduler also runs it every minute)

## Scheduling (Production)

```cron
* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
```

## Documentation

For detailed configuration, service/command/job behavior, queue/Horizon setup, data model and indexes, repository query catalog, and troubleshooting, see:

- [Uptime Kuma Integration Guide](docs/uptime-kuma.md)

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
