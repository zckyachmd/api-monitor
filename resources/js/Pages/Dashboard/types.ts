export type MonitorItem = {
    monitor_url: string;
    monitor_name: string;
    monitor_hostname?: string | null;
    monitor_port?: string | null;
    status: number;
    status_label: string;
    response_time_ms: number | null;
    uptime_percent: number | null;
    cert_days_remaining: number | null;
    cert_is_valid: boolean | null;
    fetched_at: string;
    down_minutes?: number | null;
    down_start_at?: string;
    resp_series?: { bucket: string; value: number }[];
};

export type DashboardSummary = {
    total: number;
    up: number;
    down: number;
    pending: number;
    maintenance: number;
};

export type DashboardSeries = {
    up: { bucket: string; value: number }[];
    pending: { bucket: string; value: number }[];
    down: { bucket: string; value: number }[];
};

export type DashboardFilters = {
    range: string;
    since?: string;
    auto?: number;
};

export type DashboardData = {
    summary: DashboardSummary;
    monitors: MonitorItem[];
    series: DashboardSeries;
};

export type DashboardPageProps = {
    filters: DashboardFilters;
} & DashboardData;
