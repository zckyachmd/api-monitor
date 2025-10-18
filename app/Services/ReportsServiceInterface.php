<?php

namespace App\Services;

interface ReportsServiceInterface
{
    /**
     * Build data for Reports overview page.
     */
    public function buildOverview(?string $start, ?string $end, string $bucket, int $auto): array;

    /**
     * Build export dataset (rows, headings, filename).
     */
    public function buildExport(string $dataset, string $range, string $bucket): array;
}

