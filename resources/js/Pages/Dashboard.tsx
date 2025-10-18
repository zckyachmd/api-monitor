import * as React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { HeaderToolbar } from '@/pages/Dashboard/components/HeaderToolbar';
import { SummaryCards } from '@/pages/Dashboard/components/SummaryCards';
import { MonitorsGrid } from '@/pages/Dashboard/components/MonitorsGrid';
import type { DashboardPageProps } from '@/pages/Dashboard/types';

export default function Dashboard() {
    const { props } = usePage<DashboardPageProps>();
    const { filters, summary, monitors, series } = props;

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

    React.useEffect(() => {
        setUpdatedAt(new Date());
    }, [props]);

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
        router.get(
            '/dashboard',
            { ...filters, since: '24h', auto: autoMs },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['summary', 'monitors'],
            },
        );
        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
        };
    }, [autoMs, refresh, filters]);

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
                <SummaryCards summary={summary} series={series} />
                <MonitorsGrid monitors={monitors} loading={loading} />
            </div>
        </>
    );
}
