<?php

namespace App\Console\Commands;

use App\Jobs\FetchUptimeKumaMetricsJob;
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
    protected $description = 'Queue a job to fetch Uptime Kuma metrics and store them';

    public function handle(): int
    {
        $overrideBase = $this->argument('baseUrl');

        FetchUptimeKumaMetricsJob::dispatch($overrideBase);

        $this->info('Dispatched FetchUptimeKumaMetricsJob'.($overrideBase ? " ({$overrideBase})" : ''));

        return self::SUCCESS;
    }
}
