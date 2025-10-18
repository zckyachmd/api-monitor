<?php

namespace App\Services\Kuma;

use Illuminate\Support\Facades\Http;

class KumaService implements KumaServiceInterface
{
    public function fetchMetricsText(?string $baseUrl = null): string
    {
        $base = $baseUrl !== null ? $baseUrl : (string) config('uptime-kuma.base_url');
        $apiKey = (string) config('uptime-kuma.api_key');
        $timeout = (int) config('uptime-kuma.timeout', 10);
        $verifyTls = (bool) config('uptime-kuma.verify_tls', true);

        if ($base === '') {
            throw new \RuntimeException('UPTIME_KUMA_URL is not configured.');
        }

        $url = rtrim($base, '/').'/metrics';

        $request = Http::timeout($timeout)->withOptions(['verify' => $verifyTls]);
        if ($apiKey !== '') {
            $basic = base64_encode(':' . $apiKey);
            $request = $request->withHeaders(['Authorization' => 'Basic '.$basic]);
        }

        $response = $request->get($url);
        if (! $response->ok()) {
            throw new \RuntimeException('Failed fetching metrics. HTTP '.$response->status());
        }

        return $response->body();
    }

    public function parseMonitors(string $text): array
    {
        $monitors = [];
        $lines = preg_split('/\r?\n/', $text);

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (! preg_match('/^monitor_(cert_days_remaining|cert_is_valid|response_time|status)\{([^}]*)\}\s+([0-9eE+\-.]+)$/', $line, $m)) {
                continue;
            }

            $metricName = $m[1];
            $labelString = $m[2];
            $value = $m[3];

            $labels = $this->parseLabels($labelString);
            $key = ($labels['monitor_url'] ?? '').'|'.($labels['monitor_name'] ?? '');

            if (! isset($monitors[$key])) {
                $monitors[$key] = [
                    'monitor_name' => $labels['monitor_name'] ?? null,
                    'monitor_type' => $labels['monitor_type'] ?? null,
                    'monitor_url' => $labels['monitor_url'] ?? null,
                    'monitor_hostname' => $this->nullify($labels['monitor_hostname'] ?? null),
                    'monitor_port' => $this->nullify($labels['monitor_port'] ?? null),
                ];
            }

            $monitors[$key][$metricName] = $value;
        }

        return $monitors;
    }

    public function fetchAndParse(?string $baseUrl = null): array
    {
        $text = $this->fetchMetricsText($baseUrl);
        return $this->parseMonitors($text);
    }

    protected function parseLabels(string $labelString): array
    {
        $labels = [];
        $i = 0; $n = strlen($labelString);

        while ($i < $n) {
            while ($i < $n && ($labelString[$i] === ' ' || $labelString[$i] === ',')) $i++;
            if ($i >= $n) break;

            $keyStart = $i;
            while ($i < $n && preg_match('/[A-Za-z0-9_]/', $labelString[$i])) $i++;
            $key = substr($labelString, $keyStart, $i - $keyStart);
            if ($key === '' || $i >= $n || $labelString[$i] !== '=') break;
            $i++; // '='

            if ($i >= $n || $labelString[$i] !== '"') break;
            $i++; // opening quote

            $value = '';
            while ($i < $n) {
                $ch = $labelString[$i];
                if ($ch === '\\' && $i + 1 < $n) {
                    $value .= $labelString[$i + 1];
                    $i += 2;
                    continue;
                }
                if ($ch === '"') { $i++; break; }
                $value .= $ch; $i++;
            }

            $labels[$key] = $value;
            while ($i < $n && $labelString[$i] !== ',') $i++;
            if ($i < $n && $labelString[$i] === ',') $i++;
        }

        return $labels;
    }

    protected function nullify(?string $value): ?string
    {
        if ($value === null) return null;
        $v = trim($value);
        return $v === '' || strtolower($v) === 'null' ? null : $v;
    }
}

