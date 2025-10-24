import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkline } from '@/components/ui/sparkline';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle as DialogTitleCmp,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    GripVertical,
    Maximize2,
    Info,
    Clock,
    TrendingUp,
    TrendingDown,
    Activity as ActivityIcon,
    Timer,
    ChevronsDown,
    ChevronsUp,
    Gauge,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatusDot } from '@/pages/Dashboard/components/StatusDot';
import { pct, statusColorVar } from '@/pages/Dashboard/utils';
import type { MonitorItem } from '@/pages/Dashboard/types';

type Props = {
    monitors: MonitorItem[];
};

export function MonitorsGrid({ monitors }: Props) {
    const [order, setOrder] = React.useState<string[]>(() => {
        try {
            const urls = monitors.map((m) => m.monitor_url);
            const saved = JSON.parse(
                localStorage.getItem('dashboard:cardOrder') || '[]',
            ) as string[];
            const valid = saved.filter((u) => urls.includes(u));
            const remainder = urls.filter((u) => !valid.includes(u));
            return [...valid, ...remainder];
        } catch {
            return monitors.map((m) => m.monitor_url);
        }
    });
    const [dragging, setDragging] = React.useState<string | null>(null);
    const [dragOver, setDragOver] = React.useState<string | null>(null);

    React.useEffect(() => {
        const urls = monitors.map((m) => m.monitor_url);
        setOrder((prev) => {
            const valid = prev.filter((u) => urls.includes(u));
            const remainder = urls.filter((u) => !valid.includes(u));
            const next = [...valid, ...remainder];
            if (next.length === prev.length && next.every((u, i) => u === prev[i])) return prev;
            return next;
        });
    }, [monitors]);

    const displayed = React.useMemo(() => {
        if (!order.length) return monitors;
        const map = new Map(monitors.map((m) => [m.monitor_url, m] as const));
        const arranged = order.map((u) => map.get(u)).filter(Boolean) as MonitorItem[];
        const rest = monitors.filter((m) => !order.includes(m.monitor_url));
        return [...arranged, ...rest];
    }, [order, monitors]);

    function onDragStart(url: string) {
        setDragging(url);
    }
    function onDragOver(e: React.DragEvent) {
        e.preventDefault();
    }
    function onDrop(targetUrl: string) {
        if (!dragging || dragging === targetUrl) return;
        const next = [...order];
        const from = next.indexOf(dragging);
        const to = next.indexOf(targetUrl);
        if (from === -1 || to === -1) return;
        next.splice(from, 1);
        next.splice(to, 0, dragging);
        setOrder(next);
        localStorage.setItem('dashboard:cardOrder', JSON.stringify(next));
        setDragging(null);
        setDragOver(null);
    }

    function copyUrl(u: string) {
        try {
            navigator.clipboard.writeText(u);
            toast.success('Endpoint copied');
        } catch {
            // ignore
        }
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayed.map((m) => (
                <Card
                    key={m.monitor_url}
                    className={`relative overflow-hidden ${dragOver === m.monitor_url ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background' : ''}`}
                    draggable
                    onDragStart={() => onDragStart(m.monitor_url)}
                    onDragOver={(e) => {
                        onDragOver(e);
                        setDragOver(m.monitor_url);
                    }}
                    onDragEnter={() => setDragOver(m.monitor_url)}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => onDrop(m.monitor_url)}
                >
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-muted-foreground cursor-grab">
                                        <GripVertical className="h-4 w-4 transition-transform duration-150 hover:scale-110" />
                                    </span>
                                    <StatusDot status={m.status} />
                                    <CardTitle className="truncate flex-1" title={m.monitor_name}>
                                        {m.monitor_name}
                                    </CardTitle>
                                </div>
                                <CardDescription
                                    className="truncate cursor-copy hover:underline"
                                    title={m.monitor_url}
                                    onClick={() => copyUrl(m.monitor_url)}
                                >
                                    {m.monitor_url}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button
                                            type="button"
                                            title="Open fullscreen"
                                            className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground transition-transform duration-150 hover:scale-110"
                                        >
                                            <Maximize2 className="h-4 w-4" />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <div className="flex items-center gap-2">
                                                <StatusDot status={m.status} />
                                                <DialogTitleCmp className="leading-none">
                                                    {m.monitor_name}
                                                </DialogTitleCmp>
                                            </div>
                                            <DialogDescription
                                                className="break-all cursor-copy hover:underline"
                                                title={m.monitor_url}
                                                onClick={() => copyUrl(m.monitor_url)}
                                            >
                                                {m.monitor_url}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">
                                                    Hostname
                                                </div>
                                                <div className="font-medium">
                                                    {m.monitor_hostname || '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Port</div>
                                                <div className="font-medium">
                                                    {m.monitor_port || '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground inline-flex items-center gap-1">
                                                    <ActivityIcon className="h-3.5 w-3.5" /> Status
                                                </div>
                                                <div className="font-medium">{m.status_label}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground inline-flex items-center gap-1">
                                                    <Timer className="h-3.5 w-3.5" /> Response
                                                </div>
                                                <div className="font-medium">
                                                    {m.status === 0
                                                        ? '—'
                                                        : typeof m.response_time_ms === 'number'
                                                          ? `${m.response_time_ms} ms`
                                                          : '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground inline-flex items-center gap-1">
                                                    <TrendingUp className="h-3.5 w-3.5" /> Uptime
                                                </div>
                                                <div className="font-medium">
                                                    {pct(m.uptime_percent)}
                                                </div>
                                            </div>
                                            {m.cert_is_valid !== null && (
                                                <div>
                                                    <div className="text-muted-foreground">
                                                        SSL Valid
                                                    </div>
                                                    <div className="font-medium">
                                                        {m.cert_is_valid ? 'Yes' : 'No'}
                                                    </div>
                                                </div>
                                            )}
                                            {typeof m.cert_days_remaining === 'number' && (
                                                <div>
                                                    <div className="text-muted-foreground">
                                                        SSL Days Remaining
                                                    </div>
                                                    <div className="font-medium">{`${m.cert_days_remaining} days`}</div>
                                                </div>
                                            )}
                                            <div className="col-span-2">
                                                <div className="text-muted-foreground inline-flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" /> Latest Check
                                                </div>
                                                <div className="font-medium">
                                                    {new Date(m.fetched_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="mb-2 text-xs text-muted-foreground inline-flex items-center gap-2">
                                                <span>Response time over time</span>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            title="Average response time per minute"
                                                            className="group inline-flex h-5 w-5 items-center justify-center text-muted-foreground"
                                                            tabIndex={-1}
                                                            aria-hidden="true"
                                                        >
                                                            <Info className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-12" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Average response time per minute over the
                                                        selected range.
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <div className="h-40">
                                                <Sparkline
                                                    data={(m.resp_series || []).map((d) => ({
                                                        value: d.value,
                                                        time: d.bucket,
                                                    }))}
                                                    colorVar={statusColorVar(m.status)}
                                                    height={160}
                                                    withTooltip
                                                />
                                            </div>
                                            {(() => {
                                                const vals = (m.resp_series || [])
                                                    .map((d) => d.value)
                                                    .filter(
                                                        (v) => typeof v === 'number' && v >= 0,
                                                    ) as number[];
                                                if (!vals.length) return null;
                                                const min = Math.min(...vals);
                                                const max = Math.max(...vals);
                                                const avg = Math.round(
                                                    vals.reduce((a, b) => a + b, 0) / vals.length,
                                                );
                                                return (
                                                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                                                        <div>
                                                            <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                <ChevronsDown className="h-3.5 w-3.5" />{' '}
                                                                Min
                                                            </div>
                                                            <div className="font-medium">
                                                                {min} ms
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                <Gauge className="h-3.5 w-3.5" />{' '}
                                                                Avg
                                                            </div>
                                                            <div className="font-medium">
                                                                {avg} ms
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                <ChevronsUp className="h-3.5 w-3.5" />{' '}
                                                                Max
                                                            </div>
                                                            <div className="font-medium">
                                                                {max} ms
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            {(() => {
                                const s = m.resp_series || [];
                                const n = s.length;
                                if (n >= 2) {
                                    const delta = Math.round(
                                        (s[n - 1]?.value ?? 0) - (s[n - 2]?.value ?? 0),
                                    );
                                    const improved = delta < 0;
                                    const same = delta === 0;
                                    return (
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0 text-[10px] ${same ? 'text-muted-foreground' : improved ? 'text-green-600 dark:text-green-400 border-green-400/30 bg-green-500/5' : 'text-red-600 dark:text-red-400 border-red-400/30 bg-red-500/5'}`}
                                        >
                                            {same ? null : improved ? (
                                                <TrendingDown className="h-3 w-3" />
                                            ) : (
                                                <TrendingUp className="h-3 w-3" />
                                            )}
                                            {Math.abs(delta)} ms
                                        </span>
                                    );
                                }
                                return null;
                            })()}
                            {m.cert_is_valid === false && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    Cert invalid
                                </Badge>
                            )}
                            {(m.cert_is_valid == null || m.cert_is_valid === true) &&
                                typeof m.cert_days_remaining === 'number' &&
                                m.cert_days_remaining <= 14 && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        Cert {m.cert_days_remaining}d
                                    </Badge>
                                )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-muted-foreground">Status</div>
                                <div className="font-medium">{m.status_label}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Response</div>
                                <div className="font-medium">
                                    {m.status === 0
                                        ? '—'
                                        : typeof m.response_time_ms === 'number'
                                          ? `${m.response_time_ms} ms`
                                          : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Uptime</div>
                                <div className="font-medium">{pct(m.uptime_percent)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Downtime</div>
                                <div className="font-medium">
                                    {m.status === 0 ? `${m.down_minutes ?? 0} min` : '—'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
