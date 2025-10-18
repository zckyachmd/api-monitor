import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Monitor, CheckCircle2, AlertTriangle, Timer } from 'lucide-react';
import { Sparkline } from '@/components/ui/sparkline';
import type { DashboardSeries, DashboardSummary } from '@/pages/Dashboard/types';

export function SummaryCards({ summary, series }: { summary: DashboardSummary; series: DashboardSeries }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="group">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground transition-transform duration-150 group-hover:scale-110" />
                            <CardTitle>Total Monitors</CardTitle>
                        </div>
                    </div>
                    <CardDescription>Tracked by latest status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{summary.total}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="group">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 transition-transform duration-150 group-hover:scale-110" />
                            <CardTitle>Up</CardTitle>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" title="What is Up?" className="group inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
                                    <Info className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-12" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Monitors currently operational. Sparkline shows count over last 24h.</TooltipContent>
                        </Tooltip>
                    </div>
                    <CardDescription>Currently operational</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{summary.up}</div>
                    <div className="mt-2 h-10">
                        <Sparkline data={series.up.map((d) => ({ value: d.value, time: d.bucket }))} colorVar={'var(--primary)'} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="group">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform duration-150 group-hover:scale-110" />
                            <CardTitle className="text-amber-600 dark:text-amber-400">Pending</CardTitle>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" title="What is Pending?" className="group inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
                                    <Info className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-12" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Monitors with checks in progress. Sparkline shows count over last 24h.</TooltipContent>
                        </Tooltip>
                    </div>
                    <CardDescription>Checks in progress</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{summary.pending}</div>
                    <div className="mt-2 h-10">
                        <Sparkline data={series.pending.map((d) => ({ value: d.value, time: d.bucket }))} colorVar={'#f59e0b'} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="group">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 transition-transform duration-150 group-hover:scale-110" />
                            <CardTitle className="text-red-600 dark:text-red-400">Down</CardTitle>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" title="What is Down?" className="group inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
                                    <Info className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-12" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Monitors currently failing. Sparkline shows count over last 24h.</TooltipContent>
                        </Tooltip>
                    </div>
                    <CardDescription>Currently failing</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{summary.down}</div>
                    <div className="mt-2 h-10">
                        <Sparkline data={series.down.map((d) => ({ value: d.value, time: d.bucket }))} colorVar={'var(--destructive)'} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
