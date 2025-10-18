<?php

namespace App\Services;

use App\Repositories\Monitoring\MonitorMetricsRepositoryInterface as Repo;

class ReportsService implements ReportsServiceInterface
{
    public function __construct(private Repo $repo)
    {
    }

    /**
     * Build data for Reports/Overview page based on params.
     * Returns the same shape used by the controller rendering.
     */
    public function buildOverview(?string $start, ?string $end, string $bucket, int $auto): array
    {
        $startDate = $start ? now()->parse($start)->startOfDay() : now()->subDays(7);
        $endDate = $end ? now()->parse($end)->endOfDay() : now();
        $since = $startDate;

        $summary = $this->repo->currentSummary();
        $uptimeTrend = $this->repo->uptimeTrend($since, $bucket);
        $respTrend = $this->repo->responseTimeTrend($since, $bucket);
        $leaderboard = $this->repo->uptimeLeaderboard($since, 10, 'desc');
        $mostDown = $this->repo->mostDown($since, 10);
        $neverDown = $this->repo->neverDown($since);
        $respStats = $this->repo->responseTimeStats($since, 10, 'desc');
        $slowest = $this->repo->slowestCurrent(10);
        $certs = $this->repo->certificatesAttentionList(30);
        $flapping = $this->repo->flappingMonitors($since, 3);
        $availabilityAll = $this->repo->availabilityByMonitor($since, 'desc');
        $downtime = $this->repo->downtimeWindows($since, null, 5);

        return [
            'filters' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
                'bucket' => $bucket,
                'since' => $since->toISOString(),
                'auto' => $auto,
            ],
            'summary' => $summary,
            'uptimeTrend' => $uptimeTrend,
            'responseTimeTrend' => $respTrend,
            'leaderboard' => $leaderboard,
            'mostDown' => $mostDown,
            'neverDown' => $neverDown,
            'responseStats' => $respStats,
            'slowestCurrent' => $slowest,
            'certificates' => $certs,
            'flapping' => $flapping,
            'availabilityAll' => $availabilityAll,
            'downtimeWindows' => $downtime,
        ];
    }

    /**
     * Build export dataset rows/headings/filename based on inputs.
     * Returns: ['rows' => array, 'headings' => array, 'filename' => string]
     */
    public function buildExport(string $dataset, string $range, string $bucket): array
    {
        $since = match ($range) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            default => now()->subDay(),
        };

        $headings = [];
        $rows = [];
        $filename = "report-{$dataset}-{$range}-".now()->format('Ymd_His').'.csv';

        switch ($dataset) {
            case 'uptimeTrend':
                $data = $this->repo->uptimeTrend($since, $bucket);
                $headings = ['bucket', 'up_count', 'total', 'uptime_percent'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->bucket,
                    (int) ($r->up_count ?? 0),
                    (int) ($r->total ?? 0),
                    (float) ($r->uptime_percent ?? 0),
                ])->toArray();
                break;
            case 'responseTimeTrend':
                $data = $this->repo->responseTimeTrend($since, $bucket);
                $headings = ['bucket', 'avg_ms'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->bucket,
                    (float) ($r->avg_ms ?? 0),
                ])->toArray();
                break;
            case 'leaderboard':
                $data = $this->repo->uptimeLeaderboard($since, 1000, 'desc');
                $headings = ['monitor_url', 'monitor_name', 'up_count', 'total', 'uptime_percent'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->up_count ?? 0),
                    (int) ($r->total ?? 0),
                    (float) ($r->uptime_percent ?? 0),
                ])->toArray();
                break;
            case 'mostDown':
                $data = $this->repo->mostDown($since, 1000);
                $headings = ['monitor_url', 'monitor_name', 'down_count', 'total'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->down_count ?? 0),
                    (int) ($r->total ?? 0),
                ])->toArray();
                break;
            case 'neverDown':
                $data = $this->repo->neverDown($since);
                $headings = ['monitor_url', 'monitor_name'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                ])->toArray();
                break;
            case 'responseStats':
                $data = $this->repo->responseTimeStats($since, 1000, 'desc');
                $headings = ['monitor_url', 'monitor_name', 'avg_ms', 'max_ms', 'total'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (float) ($r->avg_ms ?? 0),
                    (float) ($r->max_ms ?? 0),
                    (int) ($r->total ?? 0),
                ])->toArray();
                break;
            case 'slowestCurrent':
                $data = $this->repo->slowestCurrent(1000);
                $headings = ['monitor_url', 'monitor_name', 'response_time_ms'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->response_time_ms ?? 0),
                ])->toArray();
                break;
            case 'certificates':
                $data = $this->repo->certificatesAttentionList(30);
                $headings = ['monitor_url', 'monitor_name', 'cert_days_remaining', 'cert_is_valid'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->cert_days_remaining ?? 0),
                    (int) ($r->cert_is_valid ?? 0),
                ])->toArray();
                break;
            case 'flapping':
                $data = $this->repo->flappingMonitors($since, 3);
                $headings = ['monitor_url', 'monitor_name', 'flips'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->flips ?? 0),
                ])->toArray();
                break;
            case 'availabilityAll':
                $data = $this->repo->availabilityByMonitor($since, 'desc');
                $headings = ['monitor_url', 'monitor_name', 'up_count', 'total', 'uptime_percent'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->up_count ?? 0),
                    (int) ($r->total ?? 0),
                    (float) ($r->uptime_percent ?? 0),
                ])->toArray();
                break;
            case 'downtimeWindows':
                $data = $this->repo->downtimeWindows($since, null, 5);
                $headings = ['monitor_url', 'monitor_name', 'start_at', 'end_at', 'minutes'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (string) $r->start_at,
                    (string) $r->end_at,
                    (int) ($r->minutes ?? 0),
                ])->toArray();
                break;
            default:
                abort(400, 'Unknown dataset');
        }

        return compact('rows', 'headings', 'filename');
    }
}
