<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class DashboardDataUpdated implements ShouldBroadcast
{
    /**
     * The selected range (e.g. 24h, 7d, 30d)
     */
    public string $range;

    /**
     * Payload matching DashboardController::data() output.
     */
    public array $payload;

    public function __construct(string $range, array $payload)
    {
        $this->range = $range;
        $this->payload = $payload;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('dashboard.metrics.' . $this->range);
    }

    public function broadcastAs(): string
    {
        return 'dashboard.data';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}

