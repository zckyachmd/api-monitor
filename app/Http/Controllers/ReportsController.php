<?php

namespace App\Http\Controllers;

use App\Repositories\UptimeKuma\UptimeKumaMetricsRepositoryInterface as Repo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ArrayExport;

class ReportsController
{
    public function index(Request $request, Repo $repo)
    {
        $range = (string) $request->query('range', '24h'); // 24h|7d|30d
        $bucket = (string) $request->query('bucket', 'minute'); // minute|hour|day
        $auto = (int) $request->query('auto', 30_000); // ms

        $since = match ($range) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            default => now()->subDay(),
        };

        $summary = $repo->currentSummary();
        $uptimeTrend = $repo->uptimeTrend($since, $bucket);
        $respTrend = $repo->responseTimeTrend($since, $bucket);
        $leaderboard = $repo->uptimeLeaderboard($since, 10, 'desc');
        $mostDown = $repo->mostDown($since, 10);
        $neverDown = $repo->neverDown($since);
        $respStats = $repo->responseTimeStats($since, 10, 'desc');
        $slowest = $repo->slowestCurrent(10);
        $certs = $repo->certificatesAttentionList(30);
        $flapping = $repo->flappingMonitors($since, 3);
        $availabilityAll = $repo->availabilityByMonitor($since, 'desc');
        $downtime = $repo->downtimeWindows($since, null, 5);

        return Inertia::render('Reports/Overview', [
            'filters' => [
                'range' => $range,
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
        ]);
    }

    public function export(Request $request, Repo $repo)
    {
        $dataset = (string) $request->query('dataset', 'availabilityAll');
        $range = (string) $request->query('range', '24h');
        $bucket = (string) $request->query('bucket', 'minute');

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
                $data = $repo->uptimeTrend($since, $bucket);
                $headings = ['bucket', 'up_count', 'total', 'uptime_percent'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->bucket,
                    (int) ($r->up_count ?? 0),
                    (int) ($r->total ?? 0),
                    (float) ($r->uptime_percent ?? 0),
                ])->toArray();
                break;
            case 'responseTimeTrend':
                $data = $repo->responseTimeTrend($since, $bucket);
                $headings = ['bucket', 'avg_ms'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->bucket,
                    (float) ($r->avg_ms ?? 0),
                ])->toArray();
                break;
            case 'leaderboard':
                $data = $repo->uptimeLeaderboard($since, 1000, 'desc');
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
                $data = $repo->mostDown($since, 1000);
                $headings = ['monitor_url', 'monitor_name', 'down_count', 'total'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->down_count ?? 0),
                    (int) ($r->total ?? 0),
                ])->toArray();
                break;
            case 'neverDown':
                $data = $repo->neverDown($since);
                $headings = ['monitor_url', 'monitor_name'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                ])->toArray();
                break;
            case 'responseStats':
                $data = $repo->responseTimeStats($since, 1000, 'desc');
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
                $data = $repo->slowestCurrent(1000);
                $headings = ['monitor_url', 'monitor_name', 'response_time_ms'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->response_time_ms ?? 0),
                ])->toArray();
                break;
            case 'certificates':
                $data = $repo->certificatesAttentionList(30);
                $headings = ['monitor_url', 'monitor_name', 'cert_days_remaining', 'cert_is_valid'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->cert_days_remaining ?? 0),
                    (int) ($r->cert_is_valid ?? 0),
                ])->toArray();
                break;
            case 'flapping':
                $data = $repo->flappingMonitors($since, 3);
                $headings = ['monitor_url', 'monitor_name', 'flips'];
                $rows = collect($data)->map(fn ($r) => [
                    $r->monitor_url,
                    $r->monitor_name,
                    (int) ($r->flips ?? 0),
                ])->toArray();
                break;
            case 'availabilityAll':
                $data = $repo->availabilityByMonitor($since, 'desc');
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
                $data = $repo->downtimeWindows($since, null, 5);
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

        return Excel::download(new ArrayExport($rows, $headings), $filename, \Maatwebsite\Excel\Excel::CSV);
    }
}
