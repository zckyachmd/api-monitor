<?php

namespace App\Repositories\UptimeKuma;

use App\Models\UptimeKumaMetric;
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
        $up = $latest->where('status', 1)->count();
        $down = $latest->where('status', 0)->count();
        $pending = $latest->where('status', 2)->count();
        $maintenance = $latest->where('status', 3)->count();

        return compact('total', 'up', 'down', 'pending', 'maintenance');
    }

    public function uptimeLeaderboard(?\DateTimeInterface $since = null, int $limit = 10, string $direction = 'desc'): Collection
    {
        $q = DB::table('uptime_kuma_metrics')
            ->select(
                'monitor_url',
                'monitor_name',
                DB::raw('SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as up_count'),
                DB::raw('COUNT(*) as total'),
                DB::raw('ROUND(100.0 * SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 2) as uptime_percent')
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
                DB::raw('SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as down_count'),
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
            ->select('monitor_url', 'monitor_name', DB::raw('SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as down_count'))
            ->groupBy('monitor_url', 'monitor_name')
            ->havingRaw('SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) = 0');

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
                DB::raw('SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as up_count'),
                DB::raw('COUNT(*) as total'),
                DB::raw('ROUND(100.0 * SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 2) as uptime_percent')
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

