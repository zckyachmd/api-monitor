<?php

namespace App\Repositories\Monitoring;

use Illuminate\Support\Collection;

interface MonitorMetricsRepositoryInterface
{
    public function latestPerMonitor(): Collection;
    public function currentSummary(): array;
    public function uptimeLeaderboard(?\DateTimeInterface $since = null, int $limit = 10, string $direction = 'desc'): Collection;
    public function mostDown(?\DateTimeInterface $since = null, int $limit = 10): Collection;
    public function neverDown(?\DateTimeInterface $since = null): Collection;
    public function responseTimeStats(?\DateTimeInterface $since = null, int $limit = 10, string $direction = 'desc'): Collection;
    public function uptimeTrend(?\DateTimeInterface $since = null, string $bucket = 'minute', ?string $monitorUrl = null): Collection;
    public function responseTimeTrend(?\DateTimeInterface $since = null, string $bucket = 'minute', ?string $monitorUrl = null): Collection;
    public function certificatesAttentionList(int $daysThreshold = 30): Collection;
    public function slowestCurrent(int $limit = 10): Collection;
    public function flappingMonitors(?\DateTimeInterface $since = null, int $threshold = 3): Collection;
    public function downtimeWindows(?\DateTimeInterface $since = null, ?string $monitorUrl = null, int $minDurationMinutes = 1): Collection;
    public function mttr(?\DateTimeInterface $since = null): Collection;
    public function availabilityByMonitor(?\DateTimeInterface $since = null, string $direction = 'desc'): Collection;
}

