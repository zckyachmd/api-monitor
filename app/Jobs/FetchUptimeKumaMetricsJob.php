<?php

namespace App\Jobs;

use App\Models\UptimeKumaMetric;
use App\Services\UptimeKuma\UptimeKumaServiceInterface;
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

    /**
     * Queue name isolation
     */
    public string $queue = 'kuma';

    public $tries = 3;

    public $backoff = 30;

    public $timeout = 60;

    public function __construct(?string $baseUrl = null)
    {
        $this->baseUrl = $baseUrl;
    }

    public function handle(UptimeKumaServiceInterface $service): void
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

        Log::info('Uptime Kuma metrics stored', [
            'count' => count($monitors),
            'baseUrl' => $this->baseUrl ?? config('uptime-kuma.base_url'),
        ]);
    }

    /**
     * Job tags for Horizon UI
     */
    public function tags(): array
    {
        return ['kuma', 'uptime-kuma'];
    }
}
