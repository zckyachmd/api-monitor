<?php

namespace App\Console\Commands;

use App\Models\UptimeKumaMetric;
use App\Services\UptimeKuma\UptimeKumaServiceInterface;
use Illuminate\Console\Command;

class FetchUptimeKumaMetrics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kuma:fetch {baseUrl? : Optional base URL to override config}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch Uptime Kuma Prometheus metrics and store them in the database';
    public function __construct(protected UptimeKumaServiceInterface $service)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $overrideBase = $this->argument('baseUrl');
        try {
            $monitors = $this->service->fetchAndParse($overrideBase);
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $now = now();
        $count = 0;
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
            $count++;
        }

        $this->info("Stored metrics for {$count} monitors.");
        return self::SUCCESS;
    }
}
