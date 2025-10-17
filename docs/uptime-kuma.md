# Uptime Kuma Integration Guide

## Summary

This integration periodically pulls Uptime Kuma metrics (in Prometheus format), parses important data per monitor, and stores it in a database for dashboard visualization. Data retrieval runs via a job queue to ensure safety (retry/backoff) and non-blocking operation.

---

## Main Components

- Configuration: `config/uptime-kuma.php`
  - `base_url` (`UPTIME_KUMA_URL`) – base URL of Uptime Kuma, example: `http://192.168.1.3:3444`
  - `api_key` (`UPTIME_KUMA_API_KEY`) – used as Basic Auth (empty username, password = API key)
  - `timeout`, `verify_tls`

- Service: `app/Services/UptimeKuma/UptimeKumaService.php`
  - Fixed endpoint: `/metrics`
  - Auth: `Authorization: Basic <base64(':'+API_KEY)>`
  - HTTP options: timeout, TLS verification
  - Prometheus label parser that safely handles quoted values

- Command & Scheduler: `app/Console/Commands/FetchUptimeKumaMetrics.php`, `routes/console.php:12`
  - Command: `kuma:fetch {baseUrl?}` → only dispatches the Job
  - Scheduler: runs `kuma:fetch` every minute
  - If Horizon is active: `horizon:snapshot` every 5 minutes for Horizon metrics

- Job: `app/Jobs/FetchUptimeKumaMetricsJob.php`
  - Queue: `kuma` (isolated)
  - `tries=3`, `backoff=30s`, `timeout=60s`
  - Stores one row per monitor per fetch with `fetched_at=now()`

- Model & Database Schema
  - Model: `app/Models/UptimeKumaMetric.php` (`$timestamps=false`)
  - Status Enum: `app/Enums/MonitorStatus.php` (DOWN=0, UP=1, PENDING=2, MAINTENANCE=3)
  - Migration: `database/migrations/2025_10_17_000000_create_uptime_kuma_metrics_table.php`
    - Columns: `monitor_*`, `cert_days_remaining`, `cert_is_valid`, `response_time_ms`, `status`, `fetched_at`
    - Indexes: `(monitor_name, monitor_url)`, `fetched_at`, `(monitor_url,fetched_at)`, `(status,fetched_at)`, `(cert_is_valid,fetched_at)`

- Repository (for dashboard): `app/Repositories/UptimeKuma/UptimeKumaMetricsRepository.php`
  - `latestPerMonitor()` – latest snapshot per monitor
  - `currentSummary()` – totals of up, down, pending, maintenance (based on snapshot)
  - `uptimeLeaderboard(?since, limit, direction)` – uptime ranking
  - `mostDown(?since, limit)` – most frequently down
  - `neverDown(?since)` – never down
  - `responseTimeStats(?since, limit, direction)` – average & maximum response times
  - `uptimeTrend(?since, bucket, ?monitorUrl)` – uptime trend (minute|hour|day)
  - `responseTimeTrend(?since, bucket, ?monitorUrl)` – average response time trend
  - `certificatesAttentionList(daysThreshold)` – invalid or soon-to-expire certificates
  - `slowestCurrent(limit)` – currently slowest (snapshot)
  - `flappingMonitors(?since, threshold)` – number of status flips (stability)
  - `downtimeWindows(?since, ?monitorUrl, minDurationMinutes)` – down intervals
  - `mttr(?since)` – Mean Time To Recovery per monitor
  - `availabilityByMonitor(?since, direction)` – uptime percentage per monitor (comprehensive)

## Running With/Without Redis & Horizon

- With Redis + Horizon (recommended for production)
  - .env: `QUEUE_CONNECTION=redis`
  - Run Horizon: `php artisan horizon`
  - UI: `/horizon`
  - Scheduler (automatic):
    - `kuma:fetch` every minute (dispatches job to `kuma` queue)
    - `horizon:snapshot` every 5 minutes

- Without Redis (without Horizon)
  - .env: `QUEUE_CONNECTION=database` (or other driver)
  - Worker: `php artisan queue:work --queue=kuma`
  - Scheduler still dispatches jobs; Horizon is not required.
  - Note: `routes/console.php:12` schedules `horizon:snapshot`. If not using Redis/Horizon, it is advisable to remove or guard this line to avoid errors.

## Relevant .env Variables

- Required:
  - `UPTIME_KUMA_URL=http://192.168.1.3:3444`
  - `UPTIME_KUMA_API_KEY=...` (Kuma token)
  - `APP_TIMEZONE=Asia/Jakarta` (optional)

- Queue/Worker:
  - With Redis: `QUEUE_CONNECTION=redis`
  - Without Redis: `QUEUE_CONNECTION=database`

- HTTP:
  - `UPTIME_KUMA_TIMEOUT=10`, `UPTIME_KUMA_VERIFY_TLS=true|false`

## Usage Examples (server-side)

```
// Manual dispatch (optional)
php artisan kuma:fetch

// Worker without Horizon
php artisan queue:work --queue=kuma

// Check schedule
php artisan schedule:list
```

Example fetching data for dashboard (via container):

```php
$repo = app(\App\Repositories\UptimeKuma\UptimeKumaMetricsRepositoryInterface::class);

$summary = $repo->currentSummary();
$leaderboard = $repo->uptimeLeaderboard(now()->subDays(7), 10);
$trend = $repo->uptimeTrend(now()->subDays(7), 'hour');
$certs = $repo->certificatesAttentionList(30);
```

## Troubleshooting

- 401 Unauthorized when fetching
  - Ensure `UPTIME_KUMA_API_KEY` is correct. Authentication uses Basic Auth with empty username and password = API key.

- SSL/TLS error
  - Try setting `UPTIME_KUMA_VERIFY_TLS=false` for self-signed endpoints.

- Job not processed
  - Ensure worker is running: Horizon (`php artisan horizon`) or `queue:work --queue=kuma`.
  - Check `QUEUE_CONNECTION` matches your environment.

- Scheduler not running
  - Set up cron: `* * * * * php artisan schedule:run >> /dev/null 2>&1`
  - Use `php artisan schedule:list` to verify.

---

_Last updated: October 17, 2025_
