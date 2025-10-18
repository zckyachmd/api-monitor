<?php

namespace App\Services\Monitoring;

use App\Enums\MonitorStatus;
use App\Repositories\Monitoring\MonitorMetricsRepositoryInterface as Repo;
use Illuminate\Support\Facades\DB;

class MonitoringService implements MonitoringServiceInterface
{
    public function __construct(private Repo $repo)
    {
    }

    /**
     * Build data for Dashboard page based on range.
     * Returns: [since(Carbon), summary(array), monitors(array), series(array)]
     */
    public function getData(string $range): array
    {
        $since = match ($range) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            default => now()->subDay(),
        };

        $latest = $this->repo->latestPerMonitor();
        $availability = $this->repo->availabilityByMonitor($since, null, 'desc');

        $availMap = collect($availability)->keyBy('monitor_url');

        $items = [];
        $downMonitors = [];

        foreach ($latest as $row) {
            $url = $row->monitor_url;
            $name = $row->monitor_name;
            $status = (int) $row->status;
            $uptime = optional($availMap->get($url))->uptime_percent ?? null;

            $items[$url] = [
                'monitor_url' => $url,
                'monitor_name' => $name,
                'monitor_hostname' => $row->monitor_hostname ?? null,
                'monitor_port' => $row->monitor_port ?? null,
                'status' => $status,
                'status_label' => match ($status) {
                    MonitorStatus::UP->value => 'UP',
                    MonitorStatus::DOWN->value => 'DOWN',
                    MonitorStatus::PENDING->value => 'PENDING',
                    MonitorStatus::MAINTENANCE->value => 'MAINTENANCE',
                    default => 'UNKNOWN',
                },
                'response_time_ms' => $row->response_time_ms,
                'uptime_percent' => $uptime,
                'cert_days_remaining' => $row->cert_days_remaining,
                'cert_is_valid' => $row->cert_is_valid,
                'fetched_at' => (string) $row->fetched_at,
                'down_minutes' => null,
            ];

            if ($status === MonitorStatus::DOWN->value) {
                $downMonitors[] = $url;
            }
        }

        foreach ($downMonitors as $url) {
            $windows = $this->repo->downtimeWindows($since, null, $url, 1);
            if ($windows->count() > 0) {
                $last = $windows->last();
                $items[$url]['down_minutes'] = (int) ($last->minutes ?? 0);
                $items[$url]['down_start_at'] = (string) ($last->start_at ?? '');
            }
        }

        $summary = [
            'total' => count($items),
            'up' => collect($items)->where('status', MonitorStatus::UP->value)->count(),
            'down' => collect($items)->where('status', MonitorStatus::DOWN->value)->count(),
            'pending' => collect($items)->where('status', MonitorStatus::PENDING->value)->count(),
            'maintenance' => collect($items)->where('status', MonitorStatus::MAINTENANCE->value)->count(),
        ];

        // Response time sparkline per monitor (avg per minute)
        $urls = collect($items)->pluck('monitor_url')->all();
        if (! empty($urls)) {
            [$expr2, $alias2] = $this->bucketExpression('minute');
            $respRows = DB::table('uptime_kuma_metrics')
                ->select(
                    'monitor_url',
                    DB::raw("$expr2 as $alias2"),
                    DB::raw('ROUND(AVG(response_time_ms), 2) as avg_ms')
                )
                ->whereNotNull('response_time_ms')
                ->whereIn('monitor_url', $urls)
                ->where('fetched_at', '>=', $since)
                ->groupBy('monitor_url', $alias2)
                ->orderBy('monitor_url')
                ->orderBy($alias2)
                ->get();

            $byMonitor = [];
            foreach ($respRows as $r) {
                $byMonitor[$r->monitor_url][] = ['bucket' => (string) $r->$alias2, 'value' => (float) $r->avg_ms];
            }
            foreach ($items as $url => &$it) {
                $it['resp_series'] = $byMonitor[$url] ?? [];
            }
            unset($it);
        }

        // Build status series per bucket for sparklines
        [$expr, $alias] = $this->bucketExpression('minute');
        $seriesRows = DB::table('uptime_kuma_metrics')
            ->select(
                DB::raw("$expr as $alias"),
                DB::raw('SUM(CASE WHEN status = '.MonitorStatus::UP->value.' THEN 1 ELSE 0 END) as up_count'),
                DB::raw('SUM(CASE WHEN status = '.MonitorStatus::PENDING->value.' THEN 1 ELSE 0 END) as pending_count'),
                DB::raw('SUM(CASE WHEN status = '.MonitorStatus::DOWN->value.' THEN 1 ELSE 0 END) as down_count')
            )
            ->where('fetched_at', '>=', $since)
            ->groupBy($alias)
            ->orderBy($alias)
            ->get();

        $series = [
            'up' => $seriesRows->map(fn ($r) => ['bucket' => $r->$alias, 'value' => (int) $r->up_count])->toArray(),
            'pending' => $seriesRows->map(fn ($r) => ['bucket' => $r->$alias, 'value' => (int) $r->pending_count])->toArray(),
            'down' => $seriesRows->map(fn ($r) => ['bucket' => $r->$alias, 'value' => (int) $r->down_count])->toArray(),
        ];

        return [
            'since' => $since,
            'summary' => $summary,
            'monitors' => array_values($items),
            'series' => $series,
        ];
    }

    protected function bucketExpression(string $bucket = 'minute'): array
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
        return ["fetched_at", $alias];
    }
}
