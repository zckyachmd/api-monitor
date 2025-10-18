import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, BarChart, Bar, ComposedChart, LabelList } from 'recharts';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Timer, Info } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';
import { Tooltip as Tip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
    filters: { range: string; bucket: string; since: string; auto?: number };
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

    const [start, setStart] = React.useState<string>((filters as any).start || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
    const [end, setEnd] = React.useState<string>((filters as any).end || new Date().toISOString().slice(0, 10));
    const onBucketChange = (value: string) => {
        router.get(
            '/reports',
            { ...(filters as any), bucket: value, start, end },
            { preserveState: true, preserveScroll: true },
        );
    };
    const onDateChange = (which: 'start' | 'end', value: string) => {
        if (which === 'start') setStart(value);
        else setEnd(value);
        const params = {
            ...(filters as any),
            start: which === 'start' ? value : start,
            end: which === 'end' ? value : end,
        };
        router.get('/reports', params, { preserveState: true, preserveScroll: true });
    };

    // Refresh controls
    const [autoMs, setAutoMs] = React.useState<number>(() => {
        const fromUrl = (() => {
            try {
                return parseInt(new URLSearchParams(window.location.search).get('auto') || '');
            } catch {
                return NaN;
            }
        })();
        if (!Number.isNaN(fromUrl) && fromUrl >= 0) return fromUrl;
        const stored = localStorage.getItem('reports:autoRefreshMs');
        return stored ? parseInt(stored, 10) || 60_000 : 60_000; // default 1m
    });
    const intervalRef = React.useRef<number | null>(null);
    const refresh = React.useCallback(() => {
        router.reload({
            only: [
                'summary',
                'uptimeTrend',
                'responseTimeTrend',
                'leaderboard',
                'mostDown',
                'neverDown',
                'responseStats',
                'slowestCurrent',
                'certificates',
                'flapping',
                'availabilityAll',
                'downtimeWindows',
            ],
        });
    }, []);
  React.useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
        if (autoMs > 0) {
            intervalRef.current = window.setInterval(() => refresh(), autoMs) as unknown as number;
        }
    localStorage.setItem('reports:autoRefreshMs', String(autoMs));
        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
        };
  }, [autoMs, refresh, filters]);

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
                        <Tabs value={filters.range} onValueChange={onRangeChange}>
                            <TabsList className="flex-wrap gap-1">
                                <TabsTrigger value="24h">24h</TabsTrigger>
                                <TabsTrigger value="7d">7d</TabsTrigger>
                                <TabsTrigger value="30d">30d</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Tabs value={filters.bucket} onValueChange={onBucketChange}>
                            <TabsList className="flex-wrap gap-1">
                                <TabsTrigger value="minute">Min</TabsTrigger>
                                <TabsTrigger value="hour">Hour</TabsTrigger>
                                <TabsTrigger value="day">Day</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    aria-label="Auto refresh options"
                                >
                                    <Timer className="h-4 w-4" />
                                    <span className="hidden sm:inline">Auto</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {[
                                    ['Off', 0],
                                    ['Every 30s', 30_000],
                                    ['Every 1m', 60_000],
                                    ['Every 5m', 300_000],
                                    ['Every 10m', 600_000],
                                    ['Every 15m', 900_000],
                                    ['Every 30m', 1_800_000],
                                ].map(([label, ms]) => (
                                    <DropdownMenuItem
                                        key={String(ms)}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setAutoMs(ms as number);
                                        }}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span>{label as string}</span>
                                            {autoMs === ms && (
                                                <span className="text-xs text-muted-foreground">
                                                    (active)
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
                                    <Download className="h-4 w-4" />{' '}
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
                                            href={`/reports/export?dataset=${key}&range=${filters.range}&bucket=${filters.bucket}&auto=${autoMs}`}
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
                    <Card>
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
                                        contentStyle={{
                                            background: 'var(--popover)',
                                            color: 'var(--popover-foreground)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                        }}
                                        labelStyle={{ color: 'var(--muted-foreground)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                        formatter={(v: number | string) => [`${v}%`, 'Uptime']}
                                        labelFormatter={formatTimeLabel}
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
                    <Card>
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
                                        contentStyle={{
                                            background: 'var(--popover)',
                                            color: 'var(--popover-foreground)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                        }}
                                        labelStyle={{ color: 'var(--muted-foreground)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                        formatter={(v: number | string) => [`${v} ms`, 'Avg']}
                                        labelFormatter={formatTimeLabel}
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Uptime</CardTitle>
                            <CardDescription>Best availability</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground">
                                    <tr>
                                        <th className="text-left">Monitor</th>
                                        <th className="text-right">Uptime</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((r) => (
                                        <tr key={r.monitor_url} className="border-b last:border-0">
                                            <td className="py-2 pr-2">
                                                <div className="truncate font-medium">
                                                    {r.monitor_name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground hidden sm:block">
                                                    {r.monitor_url}
                                                </div>
                                            </td>
                                            <td className="py-2 pl-2 text-right font-medium">
                                                {r.uptime_percent?.toFixed?.(2) ?? r.uptime_percent}
                                                %
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Most Down</CardTitle>
                            <CardDescription>Highest down occurrences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground">
                                    <tr>
                                        <th className="text-left">Monitor</th>
                                        <th className="text-right">Down Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mostDown
                                        .filter((r) => (r.down_count ?? 0) > 0)
                                        .map((r) => (
                                            <tr
                                                key={r.monitor_url}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-2 pr-2">
                                                    <div className="truncate font-medium">
                                                        {r.monitor_name}
                                                    </div>
                                                    <div className="truncate text-xs text-muted-foreground hidden sm:block">
                                                        {r.monitor_url}
                                                    </div>
                                                </td>
                                                <td className="py-2 pl-2 text-right font-medium">
                                                    {r.down_count}
                                                </td>
                                            </tr>
                                        ))}
                                    {mostDown.filter((r) => (r.down_count ?? 0) > 0).length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={2}
                                                className="py-3 text-center text-sm text-muted-foreground"
                                            >
                                                No downtime events in the selected range.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Response time stats */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Avg/Max Response Time</CardTitle>
                            <CardDescription>Top by average</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground">
                                    <tr>
                                        <th className="text-left">Monitor</th>
                                        <th className="text-right">Avg</th>
                                        <th className="text-right">Max</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {responseStats.map((r) => (
                                        <tr key={r.monitor_url} className="border-b last:border-0">
                                            <td className="py-2 pr-2">
                                                <div className="truncate font-medium">
                                                    {r.monitor_name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground hidden sm:block">
                                                    {r.monitor_url}
                                                </div>
                                            </td>
                                            <td className="py-2 pl-2 text-right">{r.avg_ms} ms</td>
                                            <td className="py-2 pl-2 text-right">{r.max_ms} ms</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <Card>
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
                        <CardContent className="h-auto">
                            <ResponsiveContainer
                                width="100%"
                                height={Math.max(200, slowestCurrent.length * 28)}
                            >
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
                                        contentStyle={{
                                            background: 'var(--popover)',
                                            color: 'var(--popover-foreground)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                        }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                        formatter={(v: number | string) => [`${v} ms`, 'Response']}
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Certificate Attention</CardTitle>
                            <CardDescription>Invalid or expiring soon</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {certificates.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No certificate issues found.
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-muted-foreground">
                                        <tr>
                                            <th className="text-left">Monitor</th>
                                            <th className="text-right">Days Left</th>
                                            <th className="text-right">Valid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {certificates.map((r) => (
                                            <tr
                                                key={r.monitor_url}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-2 pr-2">
                                                    <div className="truncate font-medium">
                                                        {r.monitor_name}
                                                    </div>
                                                    <div className="truncate text-xs text-muted-foreground hidden sm:block">
                                                        {r.monitor_url}
                                                    </div>
                                                </td>
                                                <td className="py-2 pl-2 text-right">
                                                    {r.cert_days_remaining ?? '—'}
                                                </td>
                                                <td className="py-2 pl-2 text-right">
                                                    {r.cert_is_valid === null
                                                        ? '—'
                                                        : r.cert_is_valid
                                                          ? 'Yes'
                                                          : 'No'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Flapping Monitors</CardTitle>
                            <CardDescription>Frequent status flips</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {flapping.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No flapping detected.
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-muted-foreground">
                                        <tr>
                                            <th className="text-left">Monitor</th>
                                            <th className="text-right">Flips</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {flapping.map((r) => (
                                            <tr
                                                key={r.monitor_url}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-2 pr-2">
                                                    <div className="truncate font-medium">
                                                        {r.monitor_name}
                                                    </div>
                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {r.monitor_url}
                                                    </div>
                                                </td>
                                                <td className="py-2 pl-2 text-right">{r.flips}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Availability table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Availability (All Monitors)</CardTitle>
                        <CardDescription>Within selected range</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground">
                                    <tr>
                                        <th className="text-left">Monitor</th>
                                        <th className="text-right">Uptime %</th>
                                        <th className="text-right">Samples</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {availabilityAll.map((r) => (
                                        <tr key={r.monitor_url} className="border-b last:border-0">
                                            <td className="py-2 pr-2">
                                                <div className="truncate font-medium">
                                                    {r.monitor_name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground hidden sm:block">
                                                    {r.monitor_url}
                                                </div>
                                            </td>
                                            <td className="py-2 pl-2 text-right">
                                                {r.uptime_percent?.toFixed?.(2) ?? r.uptime_percent}
                                                %
                                            </td>
                                            <td className="py-2 pl-2 text-right">{r.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Downtime windows */}
                <Card>
                    <CardHeader>
                        <CardTitle>Downtime Windows</CardTitle>
                        <CardDescription>≥ 5 minutes within range</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {downtimeWindows.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No downtime windows detected in the selected range.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-muted-foreground">
                                        <tr>
                                            <th className="text-left">Monitor</th>
                                            <th className="text-left">Start</th>
                                            <th className="text-left">End</th>
                                            <th className="text-right">Minutes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {downtimeWindows.map((r, i) => (
                                            <tr
                                                key={`${r.monitor_url}-${i}`}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-2 pr-2">
                                                    <div className="truncate font-medium">
                                                        {r.monitor_name}
                                                    </div>
                                                    <div className="truncate text-xs text-muted-foreground hidden sm:block">
                                                        {r.monitor_url}
                                                    </div>
                                                </td>
                                                <td className="py-2 pr-2">
                                                    {formatTimeLabel(r.start_at)}
                                                </td>
                                                <td className="py-2 pr-2">
                                                    {formatTimeLabel(r.end_at)}
                                                </td>
                                                <td className="py-2 pl-2 text-right">
                                                    {r.minutes}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
