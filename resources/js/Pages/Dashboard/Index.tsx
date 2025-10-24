import * as React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { HeaderToolbar } from '@/pages/Dashboard/components/HeaderToolbar';
import { SummaryCards } from '@/pages/Dashboard/components/SummaryCards';
import { MonitorsGrid } from '@/pages/Dashboard/components/MonitorsGrid';
import type { DashboardData, DashboardPageProps } from '@/pages/Dashboard/types';
import { toast } from 'sonner';
import getEcho, { type EchoLike, type ChannelLike } from '@/lib/echo';

export default function Dashboard() {
    const { props } = usePage<DashboardPageProps>();
    const { filters, summary, monitors, series } = props;
    const [data, setData] = React.useState<DashboardData>({ summary, monitors, series });

    const [updatedAt, setUpdatedAt] = React.useState<Date>(new Date());
    const abortRef = React.useRef<AbortController | null>(null);
    const reqIdRef = React.useRef(0);

    React.useEffect(() => {
        setData({ summary, monitors, series });
        setUpdatedAt(new Date());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [summary, monitors, series]);

    const refresh = React.useCallback(async () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;
        const myId = ++reqIdRef.current;

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
            if (myId === reqIdRef.current) {
                setData(json);
                setUpdatedAt(new Date());
            }
        } catch (e: unknown) {
            const err = (e && typeof e === 'object') ? (e as { name?: string; message?: unknown }) : {};
            if (err.name === 'AbortError') {
                // ignore aborted requests
            } else {
                const msg = typeof err.message === 'string' ? err.message : undefined;
                toast.error('Failed to refresh dashboard', { description: msg });
            }
        }
    }, [filters?.range]);

    React.useEffect(() => {
        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    React.useEffect(() => {
        const range = String(filters?.range || '24h');
        const echo: EchoLike | null = getEcho();
        if (!echo) return;

        const channelName = `dashboard.metrics.${range}`;
        const channel: ChannelLike = echo.channel(channelName);
        const handler = async (evt: unknown) => {
            const obj = (evt && typeof evt === 'object') ? (evt as Record<string, unknown>) : null;
            const payload = (obj && 'payload' in obj ? obj.payload : evt) as unknown;
            if (!payload) return;
            if (
                payload &&
                typeof payload === 'object' &&
                'summary' in (payload as Record<string, unknown>) &&
                'monitors' in (payload as Record<string, unknown>) &&
                'series' in (payload as Record<string, unknown>)
            ) {
                const p = payload as DashboardData;
                setData({ summary: p.summary, monitors: p.monitors, series: p.series });
                setUpdatedAt(new Date());
            } else {
                await refresh();
            }
        };
        channel.listen('.dashboard.data', handler);

        return () => {
            if (channel && typeof channel.stopListening === 'function') {
                channel.stopListening('.dashboard.data');
            }
        };
    }, [filters?.range, refresh]);

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <HeaderToolbar updatedAt={updatedAt} />
                <SummaryCards summary={data.summary} series={data.series} />
                <MonitorsGrid monitors={data.monitors} />
            </div>
        </>
    );
}
