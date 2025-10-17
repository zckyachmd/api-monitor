<?php

namespace App\Repositories\UptimeKuma;

use App\Enums\MonitorStatus;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UptimeKumaMetricsRepository implements UptimeKumaMetricsRepositoryInterface
{
    public function latestPerMonitor(): Collection
    {
        $sub = DB::table('uptime_kuma_metrics as t1')
            ->select('monitor_url', DB::raw('MAX(fetched_at) as max_fetched_at'))
            ->groupBy('monitor_url');

        $rows = DB::table('uptime_kuma_metrics as m')
            ->joinSub($sub, 'latest', function ($join) {
                $join->on('m.monitor_url', '=', 'latest.monitor_url')
                    ->on('m.fetched_at', '=', 'latest.max_fetched_at');
            })
            ->select('m.*')
            ->orderBy('m.monitor_name')
            ->get();

        return collect($rows);
    }

    public function currentSummary(): array
    {
        $latest = $this->latestPerMonitor();

        $total = $latest->count();
        $up = $latest->where('status', MonitorStatus::UP->value)->count();
        $down = $latest->where('status', MonitorStatus::DOWN->value)->count();
        $pending = $latest->where('status', MonitorStatus::PENDING->value)->count();
        $maintenance = $latest->where('status', MonitorStatus::MAINTENANCE->value)->count();

        return compact('total', 'up', 'down', 'pending', 'maintenance');
    }

    public function uptimeLeaderboard(?\DateTimeInterface $since = null, int $limit = 10, string $direction = 'desc'): Collection
    {
        $q = DB::table('uptime_kuma_metrics')
            ->select(
                'monitor_url',
                'monitor_name',
                DB::raw('SUM(CASE WHEN status = '.MonitorStatus::UP->value.' THEN 1 ELSE 0 END) as up_count'),
                DB::raw('COUNT(*) as total'),
                DB::raw('ROUND(100.0 * SUM(CASE WHEN status = '.MonitorStatus::UP->value.' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 2) as uptime_percent')
            )
            ->groupBy('monitor_url', 'monitor_name');

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }

        $direction = strtolower($direction) === 'asc' ? 'asc' : 'desc';
        $q->orderBy('uptime_percent', $direction)->orderBy('total', 'desc');

        return $q->limit($limit)->get();
    }

    public function mostDown(?\DateTimeInterface $since = null, int $limit = 10): Collection
    {
        $q = DB::table('uptime_kuma_metrics')
            ->select(
                'monitor_url',
                'monitor_name',
                DB::raw('SUM(CASE WHEN status = '.MonitorStatus::DOWN->value.' THEN 1 ELSE 0 END) as down_count'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('monitor_url', 'monitor_name')
            ->orderByDesc('down_count')
            ->orderByDesc('total');

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }

        return $q->limit($limit)->get();
    }

    public function neverDown(?\DateTimeInterface $since = null): Collection
    {
        $q = DB::table('uptime_kuma_metrics')
            ->select('monitor_url', 'monitor_name', DB::raw('SUM(CASE WHEN status = '.MonitorStatus::DOWN->value.' THEN 1 ELSE 0 END) as down_count'))
            ->groupBy('monitor_url', 'monitor_name')
            ->havingRaw('SUM(CASE WHEN status = '.MonitorStatus::DOWN->value.' THEN 1 ELSE 0 END) = 0');

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }

        return $q->orderBy('monitor_name')->get();
    }

    public function responseTimeStats(?\DateTimeInterface $since = null, int $limit = 10, string $direction = 'desc'): Collection
    {
        $q = DB::table('uptime_kuma_metrics')
            ->select(
                'monitor_url',
                'monitor_name',
                DB::raw('ROUND(AVG(response_time_ms), 2) as avg_ms'),
                DB::raw('MAX(response_time_ms) as max_ms'),
                DB::raw('COUNT(*) as total')
            )
            ->whereNotNull('response_time_ms')
            ->groupBy('monitor_url', 'monitor_name');

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }

        $direction = strtolower($direction) === 'asc' ? 'asc' : 'desc';
        $q->orderBy('avg_ms', $direction)->orderBy('total', 'desc');

        return $q->limit($limit)->get();
    }

    public function uptimeTrend(?\DateTimeInterface $since = null, string $bucket = 'minute', ?string $monitorUrl = null): Collection
    {
        [$expr, $alias] = $this->bucketExpression($bucket);

        $q = DB::table('uptime_kuma_metrics')
            ->select(
                DB::raw("$expr as $alias"),
                DB::raw('SUM(CASE WHEN status = '.MonitorStatus::UP->value.' THEN 1 ELSE 0 END) as up_count'),
                DB::raw('COUNT(*) as total'),
                DB::raw('ROUND(100.0 * SUM(CASE WHEN status = '.MonitorStatus::UP->value.' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 2) as uptime_percent')
            )
            ->groupBy($alias)
            ->orderBy($alias);

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }
        if ($monitorUrl) {
            $q->where('monitor_url', $monitorUrl);
        }

        return $q->get();
    }

    public function responseTimeTrend(?\DateTimeInterface $since = null, string $bucket = 'minute', ?string $monitorUrl = null): Collection
    {
        [$expr, $alias] = $this->bucketExpression($bucket);

        $q = DB::table('uptime_kuma_metrics')
            ->select(
                DB::raw("$expr as $alias"),
                DB::raw('ROUND(AVG(response_time_ms), 2) as avg_ms')
            )
            ->whereNotNull('response_time_ms')
            ->groupBy($alias)
            ->orderBy($alias);

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }
        if ($monitorUrl) {
            $q->where('monitor_url', $monitorUrl);
        }

        return $q->get();
    }

    public function certificatesAttentionList(int $daysThreshold = 30): Collection
    {
        // Use each monitor's latest row
        $latest = $this->latestPerMonitor();

        return $latest->filter(function ($row) use ($daysThreshold) {
            $expiringSoon = is_numeric($row->cert_days_remaining ?? null) && (int) $row->cert_days_remaining <= $daysThreshold;
            $invalid = isset($row->cert_is_valid) && ((int) $row->cert_is_valid) === 0;
            return $expiringSoon || $invalid;
        })->values()->map(function ($row) {
            return (object) [
                'monitor_url' => $row->monitor_url,
                'monitor_name' => $row->monitor_name,
                'cert_days_remaining' => $row->cert_days_remaining,
                'cert_is_valid' => $row->cert_is_valid,
            ];
        });
    }

    public function slowestCurrent(int $limit = 10): Collection
    {
        $latest = $this->latestPerMonitor();
        return $latest
            ->filter(fn ($row) => isset($row->response_time_ms))
            ->sortByDesc('response_time_ms')
            ->take($limit)
            ->values();
    }

    public function flappingMonitors(?\DateTimeInterface $since = null, int $threshold = 3): Collection
    {
        $q = DB::table('uptime_kuma_metrics')
            ->select('monitor_url', 'monitor_name', 'status', 'fetched_at')
            ->orderBy('monitor_url')
            ->orderBy('fetched_at');

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }

        $rows = $q->get();

        $flips = [];
        foreach ($rows as $r) {
            $key = $r->monitor_url;
            if (!isset($flips[$key])) {
                $flips[$key] = [
                    'monitor_url' => $r->monitor_url,
                    'monitor_name' => $r->monitor_name,
                    'flips' => 0,
                    '_prev' => $r->status,
                ];
                continue;
            }
            if ($flips[$key]['_prev'] !== $r->status) {
                $flips[$key]['flips']++;
                $flips[$key]['_prev'] = $r->status;
            }
        }

        return collect($flips)
            ->map(fn ($v) => (object) [
                'monitor_url' => $v['monitor_url'],
                'monitor_name' => $v['monitor_name'],
                'flips' => $v['flips'],
            ])
            ->filter(fn ($o) => $o->flips >= $threshold)
            ->sortByDesc('flips')
            ->values();
    }

    public function downtimeWindows(?\DateTimeInterface $since = null, ?string $monitorUrl = null, int $minDurationMinutes = 1): Collection
    {
        $q = DB::table('uptime_kuma_metrics')
            ->select('monitor_url', 'monitor_name', 'status', 'fetched_at')
            ->orderBy('monitor_url')
            ->orderBy('fetched_at');

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }
        if ($monitorUrl) {
            $q->where('monitor_url', $monitorUrl);
        }

        $rows = $q->get();

        $result = [];
        $current = [];
        foreach ($rows as $r) {
            $key = $r->monitor_url;
            if (!isset($current[$key])) {
                $current[$key] = [
                    'monitor_url' => $r->monitor_url,
                    'monitor_name' => $r->monitor_name,
                    'down_start' => null,
                    'last_time' => $r->fetched_at,
                ];
            }

            // open window when first hit DOWN
            if ($r->status === MonitorStatus::DOWN->value && $current[$key]['down_start'] === null) {
                $current[$key]['down_start'] = $r->fetched_at;
            }

            // close window when recover to non-DOWN from DOWN
            if ($r->status !== MonitorStatus::DOWN->value && $current[$key]['down_start'] !== null) {
                $start = new \DateTime($current[$key]['down_start']);
                $end = new \DateTime($r->fetched_at);
                $minutes = max(0, (int) round(($end->getTimestamp() - $start->getTimestamp()) / 60));
                if ($minutes >= $minDurationMinutes) {
                    $result[] = (object) [
                        'monitor_url' => $current[$key]['monitor_url'],
                        'monitor_name' => $current[$key]['monitor_name'],
                        'start_at' => $current[$key]['down_start'],
                        'end_at' => $r->fetched_at,
                        'minutes' => $minutes,
                    ];
                }
                $current[$key]['down_start'] = null;
            }

            $current[$key]['last_time'] = $r->fetched_at;
        }

        // If ends still down, close at last_time
        foreach ($current as $c) {
            if ($c['down_start'] !== null) {
                $start = new \DateTime($c['down_start']);
                $end = new \DateTime($c['last_time']);
                $minutes = max(0, (int) round(($end->getTimestamp() - $start->getTimestamp()) / 60));
                if ($minutes >= $minDurationMinutes) {
                    $result[] = (object) [
                        'monitor_url' => $c['monitor_url'],
                        'monitor_name' => $c['monitor_name'],
                        'start_at' => $c['down_start'],
                        'end_at' => $c['last_time'],
                        'minutes' => $minutes,
                    ];
                }
            }
        }

        return collect($result)->sortByDesc('minutes')->values();
    }

    public function mttr(?\DateTimeInterface $since = null): Collection
    {
        $windows = $this->downtimeWindows($since);
        $grouped = $windows->groupBy('monitor_url');
        return $grouped->map(function ($rows, $url) {
            $minutes = (int) round($rows->avg('minutes'));
            $name = optional($rows->first())->monitor_name ?? $url;
            return (object) [
                'monitor_url' => $url,
                'monitor_name' => $name,
                'mttr_minutes' => $minutes,
            ];
        })->values()->sortBy('mttr_minutes')->values();
    }

    public function availabilityByMonitor(?\DateTimeInterface $since = null, string $direction = 'desc'): Collection
    {
        // Reuse leaderboard without limit
        $q = DB::table('uptime_kuma_metrics')
            ->select(
                'monitor_url',
                'monitor_name',
                DB::raw('SUM(CASE WHEN status = '.MonitorStatus::UP->value.' THEN 1 ELSE 0 END) as up_count'),
                DB::raw('COUNT(*) as total'),
                DB::raw('ROUND(100.0 * SUM(CASE WHEN status = '.MonitorStatus::UP->value.' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 2) as uptime_percent')
            )
            ->groupBy('monitor_url', 'monitor_name');

        if ($since) {
            $q->where('fetched_at', '>=', $since);
        }

        $direction = strtolower($direction) === 'asc' ? 'asc' : 'desc';
        $q->orderBy('uptime_percent', $direction)->orderBy('total', 'desc');

        return $q->get();
    }

    /**
     * Build a DB expression that truncates fetched_at to given bucket.
     * Returns array [expression, alias]
     */
    protected function bucketExpression(string $bucket): array
    {
        $bucket = strtolower($bucket);
        $driver = DB::getDriverName();
        $alias = 'bucket';

        if ($driver === 'sqlite') {
            return match ($bucket) {
                'day' => ["strftime('%Y-%m-%d 00:00:00', fetched_at)", $alias],
                'hour' => ["strftime('%Y-%m-%d %H:00:00', fetched_at)", $alias],
                default => ["strftime('%Y-%m-%d %H:%M:00', fetched_at)", $alias],
            };
        }

        if ($driver === 'mysql' || $driver === 'mariadb') {
            return match ($bucket) {
                'day' => ["DATE_FORMAT(fetched_at, '%Y-%m-%d 00:00:00')", $alias],
                'hour' => ["DATE_FORMAT(fetched_at, '%Y-%m-%d %H:00:00')", $alias],
                default => ["DATE_FORMAT(fetched_at, '%Y-%m-%d %H:%i:00')", $alias],
            };
        }

        if ($driver === 'pgsql') {
            return match ($bucket) {
                'day' => ["date_trunc('day', fetched_at)", $alias],
                'hour' => ["date_trunc('hour', fetched_at)", $alias],
                default => ["date_trunc('minute', fetched_at)", $alias],
            };
        }

        // Fallback: minute-level using raw fetched_at
        return ["fetched_at", $alias];
    }
}
