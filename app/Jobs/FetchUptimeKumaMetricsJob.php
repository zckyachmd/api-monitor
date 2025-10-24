<?php

namespace App\Jobs;

use App\Models\UptimeKumaMetric;
use App\Events\DashboardDataUpdated;
use App\Services\Kuma\KumaServiceInterface;
use App\Services\Monitoring\MonitoringServiceInterface;
use App\Repositories\Monitoring\MonitorMetricsRepositoryInterface as MetricsRepo;
use App\Enums\MonitorStatus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchUptimeKumaMetricsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public ?string $baseUrl;


    public $tries = 3;

    public $backoff = 30;

    public $timeout = 60;

    public function __construct(?string $baseUrl = null)
    {
        $this->baseUrl = $baseUrl;
        $this->onQueue('kuma');
    }

    public function tags(): array
    {
        return ['kuma', 'uptime-kuma'];
    }

    public function handle(KumaServiceInterface $service, MonitoringServiceInterface $monitoring, MetricsRepo $metricsRepo): void
    {
        $monitors = $service->fetchAndParse($this->baseUrl);

        $now = now();
        foreach ($monitors as $m) {
            UptimeKumaMetric::create([
                'monitor_name' => $m['monitor_name'] ?? 'unknown',
                'monitor_type' => $m['monitor_type'] ?? null,
                'monitor_url' => $m['monitor_url'] ?? 'unknown',
                'monitor_hostname' => $m['monitor_hostname'] ?? null,
                'monitor_port' => $m['monitor_port'] ?? null,
                'cert_days_remaining' => isset($m['cert_days_remaining']) ? (int) $m['cert_days_remaining'] : null,
                'cert_is_valid' => isset($m['cert_is_valid']) ? ((int) $m['cert_is_valid']) === 1 : null,
                'response_time_ms' => isset($m['response_time']) ? (int) $m['response_time'] : null,
                'status' => isset($m['status']) ? (int) $m['status'] : null,
                'fetched_at' => $now,
            ]);
        }

        try {
            $latest = $metricsRepo->latestPerMonitor();
            $digestParts = [
                'total' => $latest->count(),
                'up' => $latest->where('status', MonitorStatus::UP->value)->count(),
                'down' => $latest->where('status', MonitorStatus::DOWN->value)->count(),
                'pending' => $latest->where('status', MonitorStatus::PENDING->value)->count(),
                'maintenance' => $latest->where('status', MonitorStatus::MAINTENANCE->value)->count(),
                'monitors' => $latest->map(function ($r) {
                    return [
                        'u' => (string) $r->monitor_url,
                        's' => isset($r->status) ? (int) $r->status : null,
                        'rt' => isset($r->response_time_ms) ? (int) $r->response_time_ms : null,
                        'cd' => isset($r->cert_days_remaining) ? (int) $r->cert_days_remaining : null,
                        'cv' => isset($r->cert_is_valid) ? (bool) $r->cert_is_valid : null,
                    ];
                })->toArray(),
            ];
            $hash = md5(json_encode($digestParts));
            $key = 'dashboard:state_hash';
            $prev = Cache::get($key);

            if ($prev === $hash) {
                Log::info('No dashboard changes detected; skipping broadcast ticks');
            } else {
                Cache::put($key, $hash, 86400);
                foreach (['24h', '7d', '30d'] as $range) {
                    try {
                        broadcast(new DashboardDataUpdated($range, [
                            'range' => $range,
                            'ts' => now()->toISOString(),
                            'type' => 'tick',
                        ]));
                    } catch (\Throwable $e) {
                        Log::warning('Failed broadcasting dashboard tick', [
                            'range' => $range,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Failed computing dashboard digest', ['error' => $e->getMessage()]);
        }

        Log::info('Uptime Kuma metrics stored and broadcast ticks sent', [
            'count' => count($monitors),
            'baseUrl' => $this->baseUrl ?? config('uptime-kuma.base_url'),
        ]);
    }
}
