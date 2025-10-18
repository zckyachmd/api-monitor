import * as React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { HeaderToolbar } from '@/pages/Dashboard/components/HeaderToolbar';
import { SummaryCards } from '@/pages/Dashboard/components/SummaryCards';
import { MonitorsGrid } from '@/pages/Dashboard/components/MonitorsGrid';
import type { DashboardData, DashboardPageProps } from '@/pages/Dashboard/types';
import { toast } from 'sonner';

export default function Dashboard() {
    const { props } = usePage<DashboardPageProps>();
    const { filters, summary, monitors, series } = props;
    const [data, setData] = React.useState<DashboardData>({ summary, monitors, series });

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
    const [loading, setLoading] = React.useState(false);
    const intervalRef = React.useRef<number | null>(null);
    const abortRef = React.useRef<AbortController | null>(null);
    const reqIdRef = React.useRef(0);

    React.useEffect(() => {
        // Sync initial server props on first load/navigation
        setData({ summary, monitors, series });
        setUpdatedAt(new Date());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [summary, monitors, series]);

    const refresh = React.useCallback(async () => {
        // cancel previous request if any
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;
        const myId = ++reqIdRef.current;

        setLoading(true);
        try {
            const qs = new URLSearchParams({ range: String(filters?.range || '24h') });
            const res = await fetch(`/dashboard/data?${qs.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            const json = (await res.json()) as DashboardData;
            // only apply if this is the latest request
            if (myId === reqIdRef.current) {
                setData(json);
                setUpdatedAt(new Date());
            }
        } catch (e: any) {
            if (e?.name === 'AbortError') {
                // ignore aborted requests
            } else {
                toast.error('Failed to refresh dashboard', {
                    description: typeof e?.message === 'string' ? e.message : undefined,
                });
            }
        } finally {
            setLoading(false);
        }
    }, [filters?.range]);

    React.useEffect(() => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (autoMs > 0) {
            intervalRef.current = window.setInterval(() => refresh(), autoMs) as unknown as number;
        }
        localStorage.setItem('dashboard:autoRefreshMs', String(autoMs));
        // Keep URL in sync without Inertia request
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('auto', String(autoMs));
            window.history.replaceState({}, '', url.toString());
        } catch {}
        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            // abort any in-flight request on cleanup
            if (abortRef.current) abortRef.current.abort();
        };
    }, [autoMs, refresh]);

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <HeaderToolbar
                    updatedAt={updatedAt}
                    loading={loading}
                    autoMs={autoMs}
                    onRefresh={refresh}
                    onChangeAuto={setAutoMs}
                />
                <SummaryCards summary={data.summary} series={data.series} />
                <MonitorsGrid monitors={data.monitors} />
            </div>
        </>
    );
}
