import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    ResponsiveContainer,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    AreaChart,
    Area,
    BarChart,
    Bar,
    ComposedChart,
    LabelList,
} from 'recharts';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Info, CalendarClock } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';
import { Tooltip as Tip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import ChartTooltip from '@/components/ui/chart-tooltip';

type Summary = { total: number; up: number; down: number; pending: number; maintenance: number };
type TrendPoint = {
    bucket: string;
    up_count?: number;
    total?: number;
    uptime_percent?: number;
    avg_ms?: number;
};

type LeaderItem = {
    monitor_url: string;
    monitor_name: string;
    up_count?: number;
    total?: number;
    uptime_percent?: number;
    down_count?: number;
    avg_ms?: number;
    max_ms?: number;
};

type PageProps = {
    filters: { range: string; bucket: string; since: string; start?: string; end?: string };
    summary: Summary;
    uptimeTrend: TrendPoint[];
    responseTimeTrend: TrendPoint[];
    leaderboard: LeaderItem[];
    mostDown: LeaderItem[];
    neverDown: { monitor_url: string; monitor_name: string }[];
    responseStats: LeaderItem[];
    slowestCurrent: { monitor_url: string; monitor_name: string; response_time_ms: number }[];
    certificates: {
        monitor_url: string;
        monitor_name: string;
        cert_days_remaining: number | null;
        cert_is_valid: boolean | null;
    }[];
    flapping: { monitor_url: string; monitor_name: string; flips: number }[];
    availabilityAll: LeaderItem[];
    downtimeWindows: {
        monitor_url: string;
        monitor_name: string;
        start_at: string;
        end_at: string;
        minutes: number;
    }[];
};

function formatTimeLabel(ts: string) {
    // ts may be ISO or formatted; just show HH:mm or YYYY-MM-DD
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleString();
}

//

export default function ReportsOverview() {
    const { props } = usePage<PageProps>();
    const {
        filters,
        summary,
        uptimeTrend,
        responseTimeTrend,
        leaderboard,
        mostDown,
        responseStats,
        slowestCurrent,
        certificates,
        flapping,
        availabilityAll,
        downtimeWindows,
    } = props;

    const todayStr = new Date().toISOString().slice(0, 10);
    const [start, setStart] = React.useState<string>(filters.start || todayStr);
    const [end, setEnd] = React.useState<string>(filters.end || todayStr);
    const [range, setRange] = React.useState<DateRange | undefined>(() => ({
        from: start ? new Date(start) : undefined,
        to: end ? new Date(end) : undefined,
    }));
    const [bucket, setBucket] = React.useState<string>(() => {
        try {
            return filters.bucket || localStorage.getItem('reports:bucket') || 'hour';
        } catch {
            return filters.bucket || 'hour';
        }
    });
    React.useEffect(() => {
        if (filters.bucket && filters.bucket !== bucket) {
            setBucket(filters.bucket);
            try {
                localStorage.setItem('reports:bucket', filters.bucket);
            } catch {
                // ignore storage errors
            }
        }
        if (!filters.bucket) {
            try {
                const stored = localStorage.getItem('reports:bucket');
                if (stored && stored !== bucket) setBucket(stored);
            } catch {
                // ignore
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.bucket]);
    const onBucketChange = (value: string) => {
        setBucket(value);
        try {
            localStorage.setItem('reports:bucket', value);
        } catch {
            // ignore
        }
        router.get(
            '/reports',
            { ...filters, bucket: value, start, end },
            { preserveState: true, preserveScroll: true },
        );
    };
    const onRangeChange = (r?: DateRange) => {
        setRange(r);
        const s = r?.from ? r.from.toISOString().slice(0, 10) : '';
        const e = r?.to ? r.to.toISOString().slice(0, 10) : '';
        if (s) setStart(s);
        if (e) setEnd(e);
        if (s && e) {
            const params = { ...filters, start: s, end: e };
            router.get('/reports', params, { preserveState: true, preserveScroll: true });
        }
    };

    const uptimeData = useMemo(
        () => uptimeTrend.map((d) => ({ time: d.bucket, pct: d.uptime_percent || 0 })),
        [uptimeTrend],
    );
    const respData = useMemo(
        () => responseTimeTrend.map((d) => ({ time: d.bucket, ms: d.avg_ms || 0 })),
        [responseTimeTrend],
    );
    const [updatedAt, setUpdatedAt] = React.useState<Date>(new Date());

    React.useEffect(() => {
        setUpdatedAt(new Date());
    }, [props]);

    // DataTable column definitions
    const colMonitorCell = (r: LeaderItem) => (
        <div>
            <div className="truncate font-medium">{r.monitor_name}</div>
            <div className="truncate text-xs text-muted-foreground hidden sm:block">
                {r.monitor_url}
            </div>
        </div>
    );

    const colsLeaderboard: ColumnDef<LeaderItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => colMonitorCell(row.original),
            },
            {
                header: () => <div className="text-right">Uptime</div>,
                accessorKey: 'uptime_percent',
                cell: ({ row }) => (
                    <div className="text-right">
                        {row.original.uptime_percent?.toFixed?.(2) ?? row.original.uptime_percent}%
                    </div>
                ),
                meta: { thClassName: 'w-20 text-right', tdClassName: 'w-20 text-right' },
            },
        ],
        [],
    );

    const colsMostDown: ColumnDef<LeaderItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => colMonitorCell(row.original),
            },
            {
                header: () => <div className="text-right">Down</div>,
                accessorKey: 'down_count',
                cell: ({ row }) => <div className="text-right">{row.original.down_count}</div>,
                meta: { thClassName: 'w-16 text-right', tdClassName: 'w-16 text-right' },
            },
        ],
        [],
    );

    const colsRespStats: ColumnDef<LeaderItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => colMonitorCell(row.original),
            },
            {
                header: () => <div className="text-right">Avg</div>,
                accessorKey: 'avg_ms',
                cell: ({ row }) => <div className="text-right">{row.original.avg_ms} ms</div>,
                meta: { thClassName: 'w-26 text-right', tdClassName: 'w-26 text-right' },
            },
            {
                header: () => <div className="text-right">Max</div>,
                accessorKey: 'max_ms',
                cell: ({ row }) => <div className="text-right">{row.original.max_ms} ms</div>,
                meta: { thClassName: 'w-20 text-right', tdClassName: 'w-20 text-right' },
            },
        ],
        [],
    );

    const colsCertificates: ColumnDef<{
        monitor_url: string;
        monitor_name: string;
        cert_days_remaining: number | null;
        cert_is_valid: boolean | null;
    }>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => colMonitorCell(row.original as LeaderItem),
            },
            {
                header: () => <div className="text-right">Days Left</div>,
                accessorKey: 'cert_days_remaining',
                cell: ({ row }) => (
                    <div className="text-right">{row.original.cert_days_remaining ?? '—'}</div>
                ),
                meta: { thClassName: 'w-20 text-right', tdClassName: 'w-20 text-right' },
            },
            {
                header: () => <div className="text-right">Valid</div>,
                accessorKey: 'cert_is_valid',
                cell: ({ row }) => (
                    <div className="text-right">
                        {row.original.cert_is_valid === null
                            ? '—'
                            : row.original.cert_is_valid
                              ? 'Yes'
                              : 'No'}
                    </div>
                ),
                meta: { thClassName: 'w-16 text-right', tdClassName: 'w-16 text-right' },
            },
        ],
        [],
    );

    const colsFlapping: ColumnDef<{ monitor_url: string; monitor_name: string; flips: number }>[] =
        React.useMemo(
            () => [
                {
                    header: 'Monitor',
                    accessorKey: 'monitor_name',
                    cell: ({ row }) => colMonitorCell(row.original as unknown as LeaderItem),
                },
                {
                    header: () => <div className="text-right">Flips</div>,
                    accessorKey: 'flips',
                    cell: ({ row }) => <div className="text-right">{row.original.flips}</div>,
                    meta: { thClassName: 'w-16 text-right', tdClassName: 'w-16 text-right' },
                },
            ],
            [],
        );

    const colsAvailability: ColumnDef<LeaderItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => colMonitorCell(row.original),
            },
            {
                header: () => <div className="text-right">Uptime %</div>,
                accessorKey: 'uptime_percent',
                cell: ({ row }) => (
                    <div className="text-right">
                        {row.original.uptime_percent?.toFixed?.(2) ?? row.original.uptime_percent}%
                    </div>
                ),
                meta: { thClassName: 'w-26 text-right', tdClassName: 'w-26 text-right' },
            },
            {
                header: () => <div className="text-right">Samples</div>,
                accessorKey: 'total',
                cell: ({ row }) => <div className="text-right">{row.original.total}</div>,
                meta: { thClassName: 'w-16 text-right', tdClassName: 'w-16 text-right' },
            },
        ],
        [],
    );

    const colsDowntime: ColumnDef<{
        monitor_url: string;
        monitor_name: string;
        start_at: string;
        end_at: string;
        minutes: number;
    }>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => (
                    <div>
                        <div className="truncate font-medium">{row.original.monitor_name}</div>
                        <div className="truncate text-xs text-muted-foreground hidden sm:block">
                            {row.original.monitor_url}
                        </div>
                    </div>
                ),
            },
            {
                header: 'Start',
                accessorKey: 'start_at',
                cell: ({ row }) => <span>{formatTimeLabel(row.original.start_at)}</span>,
            },
            {
                header: 'End',
                accessorKey: 'end_at',
                cell: ({ row }) => <span>{formatTimeLabel(row.original.end_at)}</span>,
            },
            {
                header: () => <div className="text-right">Minutes</div>,
                accessorKey: 'minutes',
                cell: ({ row }) => <div className="text-right">{row.original.minutes}</div>,
                meta: { thClassName: 'w-16 text-right', tdClassName: 'w-16 text-right' },
            },
        ],
        [],
    );

    return (
        <>
            <Head title="Reports" />
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Reports</h1>
                        <p className="text-sm text-muted-foreground">
                            Uptime Kuma metrics visualization
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last updated {updatedAt.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto">
                            <span className="sr-only" id="date-range-label">
                                Date range
                            </span>
                            <DateRangePicker
                                value={range}
                                onChange={onRangeChange}
                                className="w-full sm:w-[320px]"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Bucket selector"
                                    className="shrink-0"
                                >
                                    <CalendarClock className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                {[
                                    ['minute', 'Minute'],
                                    ['hour', 'Hour'],
                                    ['day', 'Day'],
                                ].map(([value, label]) => (
                                    <DropdownMenuItem
                                        key={value}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            onBucketChange(value);
                                        }}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span>{label}</span>
                                            {bucket === value && (
                                                <span className="text-xs text-muted-foreground">
                                                    (selected)
                                                </span>
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span className="hidden sm:inline">Export CSV</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {[
                                    ['Uptime Trend', 'uptimeTrend'],
                                    ['Response Time Trend', 'responseTimeTrend'],
                                    ['Top Uptime', 'leaderboard'],
                                    ['Most Down', 'mostDown'],
                                    ['Never Down', 'neverDown'],
                                    ['Response Stats', 'responseStats'],
                                    ['Slowest Current', 'slowestCurrent'],
                                    ['Certificates', 'certificates'],
                                    ['Flapping', 'flapping'],
                                    ['Availability (All)', 'availabilityAll'],
                                    ['Downtime Windows', 'downtimeWindows'],
                                ].map(([label, key]) => (
                                    <DropdownMenuItem key={key} asChild>
                                        <a
                                            href={`/reports/export?dataset=${key}&bucket=${bucket}&start=${start}&end=${end}`}
                                            target="_self"
                                        >
                                            {label}
                                        </a>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Monitors</CardTitle>
                            <CardDescription>Tracked by latest status</CardDescription>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">{summary.total}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-green-600 dark:text-green-400">Up</CardTitle>
                            <CardDescription>Currently operational</CardDescription>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">{summary.up}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-amber-600 dark:text-amber-400">
                                Pending
                            </CardTitle>
                            <CardDescription>Checks in progress</CardDescription>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">{summary.pending}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600 dark:text-red-400">Down</CardTitle>
                            <CardDescription>Currently failing</CardDescription>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">{summary.down}</CardContent>
                    </Card>
                </div>

                {/* Uptime % over time + Avg response time */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle>Uptime %</CardTitle>
                                <Tip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            title="What is Uptime %?"
                                            className="text-muted-foreground inline-flex h-6 w-6 items-center justify-center"
                                        >
                                            <Info className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Percentage of UP status across all monitors over time.
                                    </TooltipContent>
                                </Tip>
                            </div>
                            <CardDescription>Aggregated across monitors</CardDescription>
                        </CardHeader>
                        <CardContent className="h-56 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={uptimeData}
                                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                                >
                                    <defs>
                                        <linearGradient id="uptime" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor={'var(--primary)'}
                                                stopOpacity={0.6}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={'var(--primary)'}
                                                stopOpacity={0.05}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={'var(--border)'} />
                                    <XAxis
                                        dataKey="time"
                                        tickFormatter={formatTimeLabel}
                                        minTickGap={24}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                        axisLine={{ stroke: 'var(--border)' }}
                                        tickLine={{ stroke: 'var(--border)' }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={(v) => `${v}%`}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                        axisLine={{ stroke: 'var(--border)' }}
                                        tickLine={{ stroke: 'var(--border)' }}
                                    />
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                valueKey="pct"
                                                valueLabel="Uptime"
                                                valueUnit="%"
                                                labelFormatter={formatTimeLabel}
                                            />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="pct"
                                        stroke={'var(--primary)'}
                                        fill="url(#uptime)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{
                                            r: 4,
                                            stroke: 'var(--primary)',
                                            strokeWidth: 1,
                                            fill: 'var(--background)',
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle>Average Response Time</CardTitle>
                                <Tip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            title="Average response time info"
                                            className="text-muted-foreground inline-flex h-6 w-6 items-center justify-center"
                                        >
                                            <Info className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Mean response time (ms) aggregated across monitors.
                                    </TooltipContent>
                                </Tip>
                            </div>
                            <CardDescription>Across monitors</CardDescription>
                        </CardHeader>
                        <CardContent className="h-56 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={respData}
                                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                                >
                                    <defs>
                                        <linearGradient id="resp" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor={'var(--primary)'}
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={'var(--primary)'}
                                                stopOpacity={0.05}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={'var(--border)'} />
                                    <XAxis
                                        dataKey="time"
                                        tickFormatter={formatTimeLabel}
                                        minTickGap={24}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                        axisLine={{ stroke: 'var(--border)' }}
                                        tickLine={{ stroke: 'var(--border)' }}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `${v} ms`}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                        axisLine={{ stroke: 'var(--border)' }}
                                        tickLine={{ stroke: 'var(--border)' }}
                                    />
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                valueKey="ms"
                                                valueLabel="Avg"
                                                valueUnit="ms"
                                                labelFormatter={formatTimeLabel}
                                            />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ms"
                                        stroke="transparent"
                                        fill="url(#resp)"
                                        isAnimationActive={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ms"
                                        stroke={'var(--primary)'}
                                        dot={false}
                                        strokeWidth={2}
                                        activeDot={{
                                            r: 4,
                                            stroke: 'var(--primary)',
                                            strokeWidth: 1,
                                            fill: 'var(--background)',
                                        }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Leaderboards */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Top Uptime</CardTitle>
                            <CardDescription>Best availability</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            <DataTable
                                storageKey="reports:leaderboard"
                                columns={colsLeaderboard}
                                data={leaderboard}
                            />
                        </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Most Down</CardTitle>
                            <CardDescription>Highest down occurrences</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {mostDown.filter((r) => (r.down_count ?? 0) > 0).length > 0 ? (
                                <DataTable
                                    storageKey="reports:mostDown"
                                    columns={colsMostDown}
                                    data={mostDown.filter((r) => (r.down_count ?? 0) > 0)}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No downtime events in the selected range.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Response time stats */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Avg/Max Response Time</CardTitle>
                            <CardDescription>Top by average</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {responseStats.length > 0 ? (
                                <DataTable
                                    storageKey="reports:responseStats"
                                    columns={colsRespStats}
                                    data={responseStats}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No response stats in the selected range.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle>Slowest Now</CardTitle>
                                <Tip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            title="Slowest monitors info"
                                            className="text-muted-foreground inline-flex h-6 w-6 items-center justify-center"
                                        >
                                            <Info className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Top monitors with highest latest response time.
                                    </TooltipContent>
                                </Tip>
                            </div>
                            <CardDescription>Based on latest readings</CardDescription>
                        </CardHeader>
                        <CardContent className="h-56 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={slowestCurrent.map((r) => ({
                                        name: r.monitor_name,
                                        ms: r.response_time_ms,
                                    }))}
                                    margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                                >
                                    <CartesianGrid
                                        horizontal={false}
                                        strokeDasharray="3 3"
                                        stroke={'var(--border)'}
                                    />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(v) => `${v} ms`}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                        axisLine={{ stroke: 'var(--border)' }}
                                        tickLine={{ stroke: 'var(--border)' }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={140}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                        axisLine={{ stroke: 'var(--border)' }}
                                        tickLine={{ stroke: 'var(--border)' }}
                                    />
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                valueKey="ms"
                                                valueLabel="Response"
                                                valueUnit="ms"
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="ms"
                                        fill={'var(--primary)'}
                                        barSize={18}
                                        radius={[0, 4, 4, 0]}
                                    >
                                        <LabelList
                                            dataKey="ms"
                                            position="right"
                                            formatter={(v: number | string) => `${v} ms`}
                                            className="text-xs"
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Certificates / Flapping */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Certificate Attention</CardTitle>
                            <CardDescription>Invalid or expiring soon</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {certificates.length > 0 ? (
                                <DataTable
                                    storageKey="reports:certificates"
                                    columns={colsCertificates}
                                    data={certificates}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No certificate issues found.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Flapping Monitors</CardTitle>
                            <CardDescription>Frequent status flips</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {flapping.length > 0 ? (
                                <DataTable
                                    storageKey="reports:flapping"
                                    columns={colsFlapping}
                                    data={flapping}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No flapping detected.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Availability table */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Availability (All Monitors)</CardTitle>
                        <CardDescription>Within selected range</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        {availabilityAll.length > 0 ? (
                            <DataTable
                                storageKey="reports:availabilityAll"
                                columns={colsAvailability}
                                data={availabilityAll}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No availability data in the selected range.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Downtime windows */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Downtime Windows</CardTitle>
                        <CardDescription>≥ 5 minutes within range</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        {downtimeWindows.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No downtime windows detected in the selected range.
                            </p>
                        ) : (
                            <DataTable
                                storageKey="reports:downtimeWindows"
                                columns={colsDowntime}
                                data={downtimeWindows}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
