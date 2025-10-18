<?php

namespace App\Services\Monitor;

interface MonitorServiceInterface
{
    /**
     * Build monitoring data for dashboard consumption.
     * Returns keys: since(Carbon), summary(array), monitors(array), series(array)
     */
    public function getData(string $range): array;
}
