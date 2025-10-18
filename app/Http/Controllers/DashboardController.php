<?php

namespace App\Http\Controllers;

use App\Services\Monitoring\MonitoringServiceInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController
{
    public function __invoke(Request $request, MonitoringServiceInterface $service)
    {
        $range = (string) $request->query('range', '24h');
        $auto = (int) $request->query('auto', 60_000);

        $data = $service->getData($range);

        return Inertia::render('Dashboard', [
            'filters' => [
                'range' => $range,
                'since' => $data['since']->toISOString(),
                'auto' => $auto,
            ],
            'summary' => $data['summary'],
            'monitors' => $data['monitors'],
            'series' => $data['series'],
        ]);
    }
}
