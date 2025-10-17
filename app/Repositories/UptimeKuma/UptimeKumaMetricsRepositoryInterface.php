<?php

namespace App\Repositories\UptimeKuma;

use Illuminate\Support\Collection;

interface UptimeKumaMetricsRepositoryInterface
{
    /**
     * Latest measurement per monitor (by monitor_url).
     */
    public function latestPerMonitor(): Collection;

    /**
     * Summary based on latest status per monitor.
     * Returns: [total, up, down, pending, maintenance]
     */
    public function currentSummary(): array;

    /**
     * Uptime leaderboard since a given time. Returns collection with
     * [monitor_url, monitor_name, up_count, total, uptime_percent]
     */
    public function uptimeLeaderboard(?\DateTimeInterface $since = null, int $limit = 10, string $direction = 'desc'): Collection;

    /**
     * Monitors with the most DOWN occurrences since a given time.
     * Returns: [monitor_url, monitor_name, down_count]
     */
    public function mostDown(?\DateTimeInterface $since = null, int $limit = 10): Collection;

    /**
     * Monitors that never went DOWN within the window. Returns: [monitor_url, monitor_name]
     */
    public function neverDown(?\DateTimeInterface $since = null): Collection;

    /**
     * Average and max response time per monitor in the window.
     * Returns: [monitor_url, monitor_name, avg_ms, max_ms]
     */
    public function responseTimeStats(?\DateTimeInterface $since = null, int $limit = 10, string $direction = 'desc'): Collection;

    /**
     * Global uptime trend by time bucket. Each row: [bucket, up_count, total, uptime_percent]
     * If monitorUrl provided, filter for that monitor.
     */
    public function uptimeTrend(?\DateTimeInterface $since = null, string $bucket = 'minute', ?string $monitorUrl = null): Collection;

    /**
     * Global average response time trend by bucket. Each row: [bucket, avg_ms]
     * If monitorUrl provided, filter for that monitor.
     */
    public function responseTimeTrend(?\DateTimeInterface $since = null, string $bucket = 'minute', ?string $monitorUrl = null): Collection;

    /**
     * Monitors with certificate issues or expiring soon based on their latest reading.
     * Returns: [monitor_url, monitor_name, cert_days_remaining, cert_is_valid]
     */
    public function certificatesAttentionList(int $daysThreshold = 30): Collection;
}

