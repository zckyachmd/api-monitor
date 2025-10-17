<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uptime_kuma_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('monitor_name');
            $table->string('monitor_type')->nullable();
            $table->string('monitor_url');
            $table->string('monitor_hostname')->nullable();
            $table->string('monitor_port')->nullable();

            $table->integer('cert_days_remaining')->nullable();
            $table->boolean('cert_is_valid')->nullable();
            $table->integer('response_time_ms')->nullable();
            $table->integer('status')->nullable();

            $table->timestamp('fetched_at');
            
            // Indexes for common query patterns
            $table->index(['monitor_name', 'monitor_url']);
            $table->index('fetched_at', 'ukm_fetched_at_idx');
            $table->index(['monitor_url', 'fetched_at'], 'ukm_monitor_url_fetched_at_idx');
            $table->index(['status', 'fetched_at'], 'ukm_status_fetched_at_idx');
            $table->index(['cert_is_valid', 'fetched_at'], 'ukm_cert_valid_fetched_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uptime_kuma_metrics');
    }
};
