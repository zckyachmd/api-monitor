<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enums\MonitorStatus;

class UptimeKumaMetric extends Model
{
    protected $table = 'uptime_kuma_metrics';

    public $timestamps = false;

    protected $fillable = [
        'monitor_name',
        'monitor_type',
        'monitor_url',
        'monitor_hostname',
        'monitor_port',
        'cert_days_remaining',
        'cert_is_valid',
        'response_time_ms',
        'status',
        'fetched_at',
    ];

    protected $casts = [
        'cert_is_valid' => 'boolean',
        'fetched_at' => 'datetime',
        'status' => MonitorStatus::class,
    ];
}
