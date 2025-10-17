<?php

return [
    // Base URL to your Uptime Kuma instance (e.g. http://192.168.1.3:3444)
    'base_url' => env('UPTIME_KUMA_URL', ''),

    // API token for authentication to Uptime Kuma
    'api_key' => env('UPTIME_KUMA_API_KEY', ''),

    // HTTP request timeout (seconds)
    'timeout' => env('UPTIME_KUMA_TIMEOUT', 10),

    // Whether to verify TLS certificates on HTTPS URLs
    'verify_tls' => env('UPTIME_KUMA_VERIFY_TLS', true),
];
