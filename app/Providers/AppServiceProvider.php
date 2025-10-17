<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\UptimeKuma\UptimeKumaServiceInterface;
use App\Services\UptimeKuma\UptimeKumaService;
use App\Repositories\UptimeKuma\UptimeKumaMetricsRepositoryInterface;
use App\Repositories\UptimeKuma\UptimeKumaMetricsRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(UptimeKumaServiceInterface::class, UptimeKumaService::class);
        $this->app->singleton(UptimeKumaMetricsRepositoryInterface::class, UptimeKumaMetricsRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
