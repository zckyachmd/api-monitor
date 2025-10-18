import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
    Timer,
    Info,
    Maximize2,
    TrendingUp,
    TrendingDown,
    GripVertical,
    Activity as ActivityIcon,
    ShieldCheck,
    ShieldX,
    Clock,
    Globe,
    Server,
    ChevronsDown,
    ChevronsUp,
    Gauge,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import * as React from 'react';
import { Sparkline } from '@/components/ui/sparkline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle as DialogTitleCmp,
    DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type MonitorItem = {
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

type PageProps = {
    filters: { range: string; since: string; auto?: number };
    summary: { total: number; up: number; down: number; pending: number; maintenance: number };
    monitors: MonitorItem[];
    series: {
        up: { bucket: string; value: number }[];
        pending: { bucket: string; value: number }[];
        down: { bucket: string; value: number }[];
    };
};

function StatusDot({ status }: { status: number }) {
    const color =
        status === 1
            ? 'bg-green-500'
            : status === 0
              ? 'bg-red-500'
              : status === 2
                ? 'bg-amber-500'
                : 'bg-blue-500';
    const ping = status === 1 || status === 0;
    return (
        <span className="relative inline-flex h-2.5 w-2.5">
            {ping && (
                <span
                    className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-ping`}
                />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
        </span>
    );
}

function pct(v?: number | null) {
    return typeof v === 'number' ? `${v.toFixed(2)}%` : '—';
}

export default function Dashboard() {
    const { props } = usePage<PageProps>();
    const { filters, summary, monitors, series } = props;
    const [order, setOrder] = React.useState<string[]>([]);
    const [dragging, setDragging] = React.useState<string | null>(null);
    const [dragOver, setDragOver] = React.useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = React.useState<Date>(new Date());
    const [autoMs, setAutoMs] = React.useState<number>(() => {
        const fromUrl = (() => {
            try {
                return parseInt(new URLSearchParams(window.location.search).get('auto') || '');
            } catch {
                return NaN;
            }
        })();
        if (!Number.isNaN(fromUrl) && fromUrl >= 0) return fromUrl;
        const stored = localStorage.getItem('dashboard:autoRefreshMs');
        return stored ? parseInt(stored, 10) || 30_000 : 30_000;
    });
    const intervalRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        setUpdatedAt(new Date());
    }, [props]);

    // Initialize card order from localStorage once monitors are available
    React.useEffect(() => {
        const urls = monitors.map((m) => m.monitor_url);
        const saved = (() => {
            try {
                return JSON.parse(localStorage.getItem('dashboard:cardOrder') || '[]');
            } catch {
                return [];
            }
        })() as string[];
        const valid = saved.filter((u) => urls.includes(u));
        const remainder = urls.filter((u) => !valid.includes(u));
        setOrder([...valid, ...remainder]);
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
    // inline handlers used for drag-over highlighting

    function copyUrl(u: string) {
        try {
            navigator.clipboard.writeText(u);
            toast.success('Endpoint copied');
        } catch (e) {
            // noop
        }
    }

    const [loading, setLoading] = React.useState(false);
    const refresh = React.useCallback(() => {
        router.reload({
            only: ['summary', 'monitors'],
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
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
        localStorage.setItem('dashboard:autoRefreshMs', String(autoMs));
        router.get('/dashboard', { ...filters, auto: autoMs }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['summary', 'monitors'],
        });
        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
        };
    }, [autoMs, refresh, filters]);

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Quick overview per monitor</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last updated {updatedAt.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
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
                    </div>
                </div>

                {/* Summary */}
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
                        <CardContent>
                            <div className="text-3xl font-bold">{summary.up}</div>
                            <div className="mt-2 h-10">
                                <Sparkline
                                    data={series.up.map((d) => ({
                                        value: d.value,
                                        time: d.bucket,
                                    }))}
                                    colorVar="var(--primary)"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-amber-600 dark:text-amber-400">
                                Pending
                            </CardTitle>
                            <CardDescription>Checks in progress</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{summary.pending}</div>
                            <div className="mt-2 h-10">
                                <Sparkline
                                    data={series.pending.map((d) => ({
                                        value: d.value,
                                        time: d.bucket,
                                    }))}
                                    colorVar="#f59e0b"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600 dark:text-red-400">Down</CardTitle>
                            <CardDescription>Currently failing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{summary.down}</div>
                            <div className="mt-2 h-10">
                                <Sparkline
                                    data={series.down.map((d) => ({
                                        value: d.value,
                                        time: d.bucket,
                                    }))}
                                    colorVar="var(--destructive)"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Monitors grid */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                              <Card key={i} className="overflow-hidden">
                                  <CardHeader>
                                      <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                                                  <Skeleton className="h-4 w-40" />
                                              </div>
                                              <Skeleton className="mt-2 h-3 w-52" />
                                          </div>
                                          <Skeleton className="h-4 w-4" />
                                      </div>
                                  </CardHeader>
                                  <CardContent>
                                      <div className="mb-3 flex gap-2">
                                          <Skeleton className="h-4 w-16" />
                                          <Skeleton className="h-4 w-20" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div>
                                              <Skeleton className="h-3 w-20" />
                                              <Skeleton className="mt-1 h-4 w-16" />
                                          </div>
                                          <div>
                                              <Skeleton className="h-3 w-20" />
                                              <Skeleton className="mt-1 h-4 w-16" />
                                          </div>
                                          <div>
                                              <Skeleton className="h-3 w-20" />
                                              <Skeleton className="mt-1 h-4 w-16" />
                                          </div>
                                          <div>
                                              <Skeleton className="h-3 w-20" />
                                              <Skeleton className="mt-1 h-4 w-16" />
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          ))
                        : displayed.map((m) => (
                              <Card
                                  key={m.monitor_url}
                                  className={`overflow-hidden ${dragOver === m.monitor_url ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background' : ''}`}
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
                                          <div>
                                              <div className="flex items-center gap-2">
                                                  <span className="text-muted-foreground cursor-grab">
                                                      <GripVertical className="h-4 w-4" />
                                                  </span>
                                                  <StatusDot status={m.status} />
                                                  <CardTitle className="truncate">
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
                                          <div className="flex items-center gap-2">
                                              <Dialog>
                                                  <DialogTrigger asChild>
                                                      <button
                                                          type="button"
                                                          title="Open fullscreen"
                                                          className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
                                                      >
                                                          <Maximize2 className="h-4 w-4" />
                                                      </button>
                                                  </DialogTrigger>
                                                  <DialogContent className="max-w-2xl">
                                                      <DialogHeader>
                                                          <DialogTitleCmp>
                                                              {m.monitor_name}
                                                          </DialogTitleCmp>
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
                                                              <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                  <ActivityIcon className="h-3.5 w-3.5" />{' '}
                                                                  Status
                                                              </div>
                                                              <div className="font-medium">
                                                                  {m.status_label}
                                                              </div>
                                                          </div>
                                                          <div>
                                                              <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                  <TrendingUp className="h-3.5 w-3.5" />{' '}
                                                                  Uptime
                                                              </div>
                                                              <div className="font-medium">
                                                                  {pct(m.uptime_percent)}
                                                              </div>
                                                          </div>
                                                          <div>
                                                              <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                  <Timer className="h-3.5 w-3.5" />{' '}
                                                                  Response
                                                              </div>
                                                              <div className="font-medium">
                                                                  {typeof m.response_time_ms ===
                                                                  'number'
                                                                      ? `${m.response_time_ms} ms`
                                                                      : '—'}
                                                              </div>
                                                          </div>
                                                          <div>
                                                              <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                  <TrendingDown className="h-3.5 w-3.5" />{' '}
                                                                  Downtime
                                                              </div>
                                                              <div className="font-medium">
                                                                  {m.status === 0
                                                                      ? `${m.down_minutes ?? 0} min`
                                                                      : '—'}
                                                              </div>
                                                          </div>
                                                          {m.monitor_hostname || m.monitor_port ? (
                                                              <div className="col-span-2 grid grid-cols-2 gap-3">
                                                                  {m.monitor_hostname && (
                                                                      <div>
                                                                          <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                              <Globe className="h-3.5 w-3.5" />{' '}
                                                                              Host
                                                                          </div>
                                                                          <div className="font-medium">
                                                                              {m.monitor_hostname}
                                                                          </div>
                                                                      </div>
                                                                  )}
                                                                  {m.monitor_port && (
                                                                      <div>
                                                                          <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                              <Server className="h-3.5 w-3.5" />{' '}
                                                                              Port
                                                                          </div>
                                                                          <div className="font-medium">
                                                                              {m.monitor_port}
                                                                          </div>
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          ) : null}
                                                          {(m.cert_is_valid === false ||
                                                              ((m.cert_is_valid == null || m.cert_is_valid === true) &&
                                                                  typeof m.cert_days_remaining ===
                                                                      'number')) && (
                                                              <div className="col-span-2 grid grid-cols-2 gap-3">
                                                                  <div>
                                                                      <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                          {m.cert_is_valid ===
                                                                          false ? (
                                                                              <ShieldX className="h-3.5 w-3.5" />
                                                                          ) : (
                                                                              <ShieldCheck className="h-3.5 w-3.5" />
                                                                          )}{' '}
                                                                          Certificate
                                                                      </div>
                                                                      <div className="font-medium">
                                                                          {m.cert_is_valid === false
                                                                              ? 'Invalid'
                                                                              : 'Valid'}
                                                                      </div>
                                                                  </div>
                                                                  <div>
                                                                      <div className="text-muted-foreground">
                                                                          SSL Days Remaining
                                                                      </div>
                                                                      <div className="font-medium">
                                                                          {typeof m.cert_days_remaining ===
                                                                          'number'
                                                                              ? `${m.cert_days_remaining} days`
                                                                              : '—'}
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          )}
                                                          <div className="col-span-2">
                                                              <div className="text-muted-foreground inline-flex items-center gap-1">
                                                                  <Clock className="h-3.5 w-3.5" />{' '}
                                                                  Latest Check
                                                              </div>
                                                              <div className="font-medium">
                                                                  {new Date(
                                                                      m.fetched_at,
                                                                  ).toLocaleString()}
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
                                                                          className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground"
                                                                      >
                                                                          <Info className="h-3.5 w-3.5" />
                                                                      </button>
                                                                  </TooltipTrigger>
                                                                  <TooltipContent>
                                                                      Average response time per
                                                                      minute over the selected
                                                                      range.
                                                                  </TooltipContent>
                                                              </Tooltip>
                                                          </div>
                                                          <div className="h-40">
                                                              <Sparkline
                                                                  data={(m.resp_series || []).map(
                                                                      (d) => ({
                                                                          value: d.value,
                                                                          time: d.bucket,
                                                                      }),
                                                                  )}
                                                                  colorVar={statusColorVar(
                                                                      m.status,
                                                                  )}
                                                                  height={160}
                                                                  withTooltip
                                                              />
                                                          </div>
                                                          {(() => {
                                                              const s = m.resp_series || [];
                                                              if (s.length) {
                                                                  const vals = s.map(
                                                                      (d) => d.value,
                                                                  );
                                                                  const min = Math.min(...vals);
                                                                  const max = Math.max(...vals);
                                                                  const avg = Math.round(
                                                                      vals.reduce(
                                                                          (a, b) => a + b,
                                                                          0,
                                                                      ) / vals.length,
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
                                                              }
                                                              return null;
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
                                                      (s[n - 1]?.value ?? 0) -
                                                          (s[n - 2]?.value ?? 0),
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
                                              <Badge
                                                  variant="destructive"
                                                  className="text-[10px] px-1.5 py-0"
                                              >
                                                  Cert invalid
                                              </Badge>
                                          )}
                                          {(m.cert_is_valid == null || m.cert_is_valid === true) &&
                                              typeof m.cert_days_remaining === 'number' &&
                                              m.cert_days_remaining <= 14 && (
                                                  <Badge
                                                      variant="outline"
                                                      className="text-[10px] px-1.5 py-0"
                                                  >
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
                                                  {typeof m.response_time_ms === 'number'
                                                      ? `${m.response_time_ms} ms`
                                                      : '—'}
                                              </div>
                                          </div>
                                          <div>
                                              <div className="text-muted-foreground">Uptime</div>
                                              <div className="font-medium">
                                                  {pct(m.uptime_percent)}
                                              </div>
                                          </div>
                                          <div>
                                              <div className="text-muted-foreground">Downtime</div>
                                              <div className="font-medium">
                                                  {m.status === 0
                                                      ? `${m.down_minutes ?? 0} min`
                                                      : '—'}
                                              </div>
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          ))}
                </div>
            </div>
        </>
    );
}
function statusColorVar(status: number): string {
    if (status === 1) return 'var(--primary)';
    if (status === 2) return '#f59e0b';
    if (status === 0) return 'var(--destructive)';
    return 'var(--muted-foreground)';
}
