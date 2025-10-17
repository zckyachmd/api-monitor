<?php

namespace App\Enums;

enum MonitorStatus: int
{
    case DOWN = 0;
    case UP = 1;
    case PENDING = 2;
    case MAINTENANCE = 3;

    public function label(): string
    {
        return match ($this) {
            self::UP => 'UP',
            self::DOWN => 'DOWN',
            self::PENDING => 'PENDING',
            self::MAINTENANCE => 'MAINTENANCE',
        };
    }
}

