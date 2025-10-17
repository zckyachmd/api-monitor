<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uptime_kuma_metrics', function (Blueprint $table) {
            if (Schema::hasColumn('uptime_kuma_metrics', 'created_at') && Schema::hasColumn('uptime_kuma_metrics', 'updated_at')) {
                $table->dropTimestamps();
            } else {
                if (Schema::hasColumn('uptime_kuma_metrics', 'created_at')) {
                    $table->dropColumn('created_at');
                }
                if (Schema::hasColumn('uptime_kuma_metrics', 'updated_at')) {
                    $table->dropColumn('updated_at');
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('uptime_kuma_metrics', function (Blueprint $table) {
            // Recreate timestamps if needed
            if (! Schema::hasColumn('uptime_kuma_metrics', 'created_at') && ! Schema::hasColumn('uptime_kuma_metrics', 'updated_at')) {
                $table->timestamps();
            }
        });
    }
};

