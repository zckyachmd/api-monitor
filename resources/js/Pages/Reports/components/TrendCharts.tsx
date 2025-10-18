import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip as Tip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Area,
    ComposedChart,
    Line,
} from 'recharts';
import ChartTooltip from '@/components/ui/chart-tooltip';
import { formatTimeLabel } from '@/pages/Reports/utils';

type TrendPoint = { time: string; pct?: number; ms?: number };

export function TrendCharts({
    uptimeData,
    respData,
}: {
    uptimeData: TrendPoint[];
    respData: TrendPoint[];
}) {
    return (
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
                                        labelFormatter={(v) => formatTimeLabel(String(v))}
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
                        <CardTitle>Avg Response Time</CardTitle>
                        <Tip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    title="How is Avg calculated?"
                                    className="text-muted-foreground inline-flex h-6 w-6 items-center justify-center"
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Average response time across monitors for each bucket.
                            </TooltipContent>
                        </Tip>
                    </div>
                    <CardDescription>Aggregated across monitors</CardDescription>
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
                                        labelFormatter={(v) => formatTimeLabel(String(v))}
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
    );
}
