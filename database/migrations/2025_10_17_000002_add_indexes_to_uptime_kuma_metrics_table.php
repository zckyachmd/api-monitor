<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uptime_kuma_metrics', function (Blueprint $table) {
            // For quickly getting latest metrics per monitor and filtering by time
            $table->index(['monitor_url', 'fetched_at'], 'ukm_monitor_url_fetched_at_idx');

            // For global time-window scans
            $table->index('fetched_at', 'ukm_fetched_at_idx');

            // For grouping / counting by status over time windows
            $table->index(['status', 'fetched_at'], 'ukm_status_fetched_at_idx');

            // For grouping valid/invalid certs over time windows
            $table->index(['cert_is_valid', 'fetched_at'], 'ukm_cert_valid_fetched_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('uptime_kuma_metrics', function (Blueprint $table) {
            $table->dropIndex('ukm_monitor_url_fetched_at_idx');
            $table->dropIndex('ukm_fetched_at_idx');
            $table->dropIndex('ukm_status_fetched_at_idx');
            $table->dropIndex('ukm_cert_valid_fetched_at_idx');
        });
    }
};

