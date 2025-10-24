<?php

namespace App\Http\Controllers;

use App\Services\Monitoring\MonitoringServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class DashboardController
{
    public function __invoke(Request $request, MonitoringServiceInterface $service)
    {
        $range = (string) $request->query('range', '24h');

        $data = $service->getData($range);

        return Inertia::render('Dashboard/Index', [
            'filters' => [
                'range' => $range,
                'since' => $data['since']->toISOString(),
            ],
            'summary' => $data['summary'],
            'monitors' => $data['monitors'],
            'series' => $data['series'],
        ]);
    }

    public function data(Request $request, MonitoringServiceInterface $service): JsonResponse
    {
        $range = (string) $request->query('range', '24h');

        $data = $service->getData($range);

        return response()->json([
            'summary' => $data['summary'],
            'monitors' => $data['monitors'],
            'series' => $data['series'],
            'since' => $data['since']->toISOString(),
        ]);
    }
}
