export type Summary = {
    total: number;
    up: number;
    down: number;
    pending: number;
    maintenance: number;
};

export type TrendPoint = {
    bucket: string;
    up_count?: number;
    total?: number;
    uptime_percent?: number;
    avg_ms?: number;
};

export type LeaderItem = {
    monitor_url: string;
    monitor_name: string;
    up_count?: number;
    total?: number;
    uptime_percent?: number;
    down_count?: number;
    avg_ms?: number;
    max_ms?: number;
};

export type SlowestCurrentItem = {
    monitor_url: string;
    monitor_name: string;
    response_time_ms: number;
};

export type CertificateItem = {
    monitor_url: string;
    monitor_name: string;
    cert_days_remaining: number | null;
    cert_is_valid: boolean | null;
};

export type FlappingItem = { monitor_url: string; monitor_name: string; flips: number };

export type DowntimeWindow = {
    monitor_url: string;
    monitor_name: string;
    start_at: string;
    end_at: string;
    minutes: number;
};

export type ReportsPageProps = {
    filters: {
        range?: string;
        auto?: number;
        bucket: string;
        since: string;
        start?: string;
        end?: string;
        fallbackApplied?: boolean;
        effectiveStart?: string;
        effectiveEnd?: string;
    };
    summary: Summary;
    uptimeTrend: TrendPoint[];
    responseTimeTrend: TrendPoint[];
    leaderboard: LeaderItem[];
    mostDown: LeaderItem[];
    neverDown: { monitor_url: string; monitor_name: string }[];
    responseStats: LeaderItem[];
    slowestCurrent: SlowestCurrentItem[];
    certificates: CertificateItem[];
    flapping: FlappingItem[];
    availabilityAll: LeaderItem[];
    downtimeWindows: DowntimeWindow[];
};
