import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import type {
    LeaderItem,
    CertificateItem,
    FlappingItem,
    DowntimeWindow,
    SlowestCurrentItem,
} from '@/pages/Reports/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ChartTooltip from '@/components/ui/chart-tooltip';
import { formatTimeLabel } from '@/pages/Reports/utils';
import { formatMonitorUrl } from '@/lib/monitor';

function MonitorCell(r: LeaderItem) {
    const url = formatMonitorUrl(r.monitor_url);
    return (
        <div className="min-w-0 max-w-[220px] sm:max-w-[280px]">
            <div className="truncate font-medium" title={r.monitor_name}>
                {r.monitor_name}
            </div>
            <div
                className="truncate text-xs text-muted-foreground hidden sm:block"
                title={url}
            >
                {url}
            </div>
        </div>
    );
}

export function Leaderboards({
    leaderboard,
    mostDown,
}: {
    leaderboard: LeaderItem[];
    mostDown: LeaderItem[];
}) {
    const colsLeaderboard: ColumnDef<LeaderItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => MonitorCell(row.original),
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
                cell: ({ row }) => MonitorCell(row.original),
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
    return (
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
                        noScrollX
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
                            noScrollX
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No downtime events in the selected range.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export function ResponseTables({
    responseStats,
    slowestCurrent,
}: {
    responseStats: LeaderItem[];
    slowestCurrent: SlowestCurrentItem[];
}) {
    const [isSmall, setIsSmall] = React.useState(false);
    const [isTiny, setIsTiny] = React.useState(false);
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 640px)');
        const handler = (e: MediaQueryListEvent | MediaQueryList) =>
            setIsSmall('matches' in e ? e.matches : (e as MediaQueryList).matches);
        // set initial
        setIsSmall(mq.matches);
        try {
            mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
        } catch {
            // Safari
            mq.addListener(handler);
        }
        return () => {
            try {
                mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
            } catch {
                // Safari
                mq.removeListener(handler);
            }
        };
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 360px)');
        const handler = (e: MediaQueryListEvent | MediaQueryList) =>
            setIsTiny('matches' in e ? e.matches : (e as MediaQueryList).matches);
        setIsTiny(mq.matches);
        try {
            mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
        } catch {
            // Safari
            mq.addListener(handler);
        }
        return () => {
            try {
                mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
            } catch {
                // Safari
                mq.removeListener(handler);
            }
        };
    }, []);

    const ellipsize = React.useCallback(
        (s: string) => {
            const limit = isSmall ? 14 : 24;
            if (!s) return '';
            return s.length > limit ? s.slice(0, limit - 1) + '…' : s;
        },
        [isSmall],
    );

    const [limit, setLimit] = React.useState<number | 'all'>('all');
    React.useEffect(() => {
        if (isSmall && limit === 'all') setLimit(8);
    }, [isSmall, limit]);
    const colsRespStats: ColumnDef<LeaderItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => MonitorCell(row.original),
            },
            {
                header: () => <div className="text-right">Avg</div>,
                accessorKey: 'avg_ms',
                cell: ({ row }) => (
                    <div className="text-right whitespace-nowrap">{row.original.avg_ms} ms</div>
                ),
                meta: {
                    thClassName: 'w-26 text-right',
                    tdClassName: 'w-26 text-right whitespace-nowrap',
                },
            },
            {
                header: () => <div className="text-right">Max</div>,
                accessorKey: 'max_ms',
                cell: ({ row }) => (
                    <div className="text-right whitespace-nowrap">{row.original.max_ms} ms</div>
                ),
                meta: {
                    thClassName: 'w-20 text-right',
                    tdClassName: 'w-20 text-right whitespace-nowrap',
                },
            },
        ],
        [],
    );

    return (
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
                            noScrollX
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
                        <div>
                            <CardTitle>Slowest Now</CardTitle>
                            <CardDescription>Current response time by monitor</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-8 px-2 text-xs">
                                    {limit === 'all' ? 'All' : `Top ${limit}`}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-28">
                                {(
                                    [
                                        { label: 'All', val: 'all' as const },
                                        { label: 'Top 5', val: 5 as const },
                                        { label: 'Top 8', val: 8 as const },
                                        { label: 'Top 10', val: 10 as const },
                                        { label: 'Top 15', val: 15 as const },
                                    ] as const
                                ).map(({ label, val }) => (
                                    <DropdownMenuItem
                                        key={String(val)}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setLimit(val);
                                        }}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span>{label}</span>
                                            {limit === val && (
                                                <span className="text-xs text-muted-foreground">
                                                    (selected)
                                                </span>
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                {(() => {
                    const barSize = isSmall ? 12 : 18;
                    const prepared = [...slowestCurrent]
                        .map((r) => ({ name: r.monitor_name, ms: r.response_time_ms }))
                        .sort((a, b) => (b.ms ?? 0) - (a.ms ?? 0));
                    const data = limit === 'all' ? prepared : prepared.slice(0, limit);
                    const yAxisWidth = isTiny ? 64 : isSmall ? 84 : 120;
                    const leftMargin = isTiny ? 2 : isSmall ? 4 : 8;
                    const chartHeight = isSmall
                        ? Math.max(160, data.length * (barSize + 8) + 32)
                        : Math.max(288, data.length * (barSize + 10) + 48);
                    return (
                        <CardContent style={{ height: chartHeight }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    layout="vertical"
                                    margin={{ left: leftMargin, right: 8, top: 8, bottom: 8 }}
                                >
                                    <XAxis
                                        type="number"
                                        domain={[0, 'dataMax']}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                        axisLine={{ stroke: 'var(--border)' }}
                                        tickLine={{ stroke: 'var(--border)' }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={yAxisWidth}
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                            fontSize: isSmall ? 11 : 12,
                                        }}
                                        tickFormatter={(v) => ellipsize(String(v))}
                                        axisLine={{ stroke: 'var(--border)' }}
                                        tickLine={{ stroke: 'var(--border)' }}
                                    />
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                valueKey="ms"
                                                valueLabel="Response"
                                                valueUnit="ms"
                                                labelFormatter={(v) => String(v)}
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="ms"
                                        fill={'var(--primary)'}
                                        barSize={barSize}
                                        radius={[0, 4, 4, 0]}
                                    >
                                        {!isSmall && (
                                            <LabelList
                                                dataKey="ms"
                                                position="right"
                                                formatter={(v: number | string) => `${v} ms`}
                                                className="text-xs"
                                            />
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    );
                })()}
            </Card>
        </div>
    );
}

export function CertificatesAndFlapping({
    certificates,
    flapping,
}: {
    certificates: CertificateItem[];
    flapping: FlappingItem[];
}) {
    const colsCertificates: ColumnDef<CertificateItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => MonitorCell(row.original as unknown as LeaderItem),
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

    const colsFlapping: ColumnDef<FlappingItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => MonitorCell(row.original as unknown as LeaderItem),
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

    return (
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
                            noScrollX
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
                            noScrollX
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">No flapping detected.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export function AvailabilityAndDowntime({
    availabilityAll,
    downtimeWindows,
}: {
    availabilityAll: LeaderItem[];
    downtimeWindows: DowntimeWindow[];
}) {
    const colsAvailability: ColumnDef<LeaderItem>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => MonitorCell(row.original),
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

    const colsDowntime: ColumnDef<DowntimeWindow>[] = React.useMemo(
        () => [
            {
                header: 'Monitor',
                accessorKey: 'monitor_name',
                cell: ({ row }) => {
                    const url = formatMonitorUrl(row.original.monitor_url);
                    return (
                        <div className="min-w-0 max-w-[220px] sm:max-w-[280px]">
                            <div className="truncate font-medium" title={row.original.monitor_name}>
                                {row.original.monitor_name}
                            </div>
                            <div
                                className="truncate text-xs text-muted-foreground hidden sm:block"
                                title={url}
                            >
                                {url}
                            </div>
                        </div>
                    );
                },
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
                            noScrollX
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No availability data in the selected range.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="h-full flex flex-col mt-4">
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
                            noScrollX
                        />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
