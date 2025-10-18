<?php

namespace App\Http\Controllers;

use App\Services\Reports\ReportsServiceInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ArrayExport;

class ReportsController
{
    public function index(Request $request, ReportsServiceInterface $service)
    {
        $bucket = (string) $request->query('bucket', 'minute');
        $auto = (int) $request->query('auto', 30_000);
        $start = $request->query('start');
        $end = $request->query('end');

        $data = $service->buildOverview($start, $end, $bucket, $auto);

        return Inertia::render('Reports/Index', $data);
    }

    public function export(Request $request, ReportsServiceInterface $service)
    {
        $dataset = (string) $request->query('dataset', 'availabilityAll');
        $range = (string) $request->query('range', '24h');
        $bucket = (string) $request->query('bucket', 'minute');
        $data = $service->buildExport($dataset, $range, $bucket);

        return Excel::download(new ArrayExport($data['rows'], $data['headings']), $data['filename'], \Maatwebsite\Excel\Excel::CSV);
    }
}
