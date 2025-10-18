<?php

namespace App\Http\Controllers;

use App\Services\MonitorServiceInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController
{
    public function __invoke(Request $request, MonitorServiceInterface $service)
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
