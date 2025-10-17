<?php

use Illuminate\Support\Facades\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule: Fetch Uptime Kuma metrics every minute
Schedule::command('kuma:fetch')->everyMinute();

// Horizon snapshots only when using Redis (to avoid errors on other drivers)
if (config('queue.default') === 'redis') {
    Schedule::command('horizon:snapshot')->everyFiveMinutes();
}
