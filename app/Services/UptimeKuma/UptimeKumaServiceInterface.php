<?php

namespace App\Services\UptimeKuma;

interface UptimeKumaServiceInterface
{
    /**
     * Fetch raw Prometheus metrics text from Uptime Kuma.
     * @param string|null $baseUrl Optional base URL override
     */
    public function fetchMetricsText(?string $baseUrl = null): string;

    /**
     * Parse Prometheus text into monitor-centric associative arrays.
     * @return array<string,array>
     */
    public function parseMonitors(string $text): array;

    /**
     * Convenience: fetch and parse in one go.
     * @param string|null $baseUrl Optional base URL override
     * @return array<string,array>
     */
    public function fetchAndParse(?string $baseUrl = null): array;
}

