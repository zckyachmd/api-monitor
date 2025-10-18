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
import ChartTooltip from '@/components/ui/chart-tooltip';
import { formatTimeLabel } from '@/pages/Reports/utils';

function MonitorCell(r: LeaderItem) {
    return (
        <div>
            <div className="truncate font-medium">{r.monitor_name}</div>
            <div className="truncate text-xs text-muted-foreground hidden sm:block">
                {r.monitor_url}
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
    );
}

export function ResponseTables({
    responseStats,
    slowestCurrent,
}: {
    responseStats: LeaderItem[];
    slowestCurrent: SlowestCurrentItem[];
}) {
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
                    <CardTitle>Slowest Now</CardTitle>
                    <CardDescription>Current response time by monitor</CardDescription>
                </CardHeader>
                <CardContent className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={slowestCurrent.map((r) => ({
                                name: r.monitor_name,
                                ms: r.response_time_ms,
                            }))}
                            layout="vertical"
                            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                        >
                            <XAxis
                                type="number"
                                tick={{ fill: 'var(--muted-foreground)' }}
                                axisLine={{ stroke: 'var(--border)' }}
                                tickLine={{ stroke: 'var(--border)' }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={120}
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
                                        labelFormatter={(v) => String(v)}
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
                        />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
