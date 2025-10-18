<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Kuma\KumaServiceInterface;
use App\Services\Kuma\KumaService;
use App\Repositories\Monitoring\MonitorMetricsRepositoryInterface;
use App\Repositories\Monitoring\MonitorMetricsRepository;
use App\Services\Monitoring\MonitoringServiceInterface;
use App\Services\Monitoring\MonitoringService;
use App\Services\Reports\ReportsServiceInterface;
use App\Services\Reports\ReportsService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(KumaServiceInterface::class, KumaService::class);
        $this->app->singleton(MonitorMetricsRepositoryInterface::class, MonitorMetricsRepository::class);
        $this->app->singleton(MonitoringServiceInterface::class, MonitoringService::class);
        $this->app->singleton(ReportsServiceInterface::class, ReportsService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
