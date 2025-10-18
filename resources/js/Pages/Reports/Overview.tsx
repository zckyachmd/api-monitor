import * as React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { FiltersBar } from '@/pages/Reports/components/FiltersBar';
import { SummaryCards } from '@/pages/Reports/components/SummaryCards';
import { TrendCharts } from '@/pages/Reports/components/TrendCharts';
import {
    Leaderboards,
    ResponseTables,
    CertificatesAndFlapping,
    AvailabilityAndDowntime,
} from '@/pages/Reports/components/Tables';
import type { DateRange } from 'react-day-picker';
import type { ReportsPageProps } from '@/pages/Reports/types';

export default function ReportsOverview() {
    const { props } = usePage<ReportsPageProps>();
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

    const todayStr = new Date().toISOString().slice(0, 10);
    const [start, setStart] = React.useState<string>(filters.start || todayStr);
    const [end, setEnd] = React.useState<string>(filters.end || todayStr);
    const [range, setRange] = React.useState<DateRange | undefined>(() => ({
        from: start ? new Date(start) : undefined,
        to: end ? new Date(end) : undefined,
    }));
    const [bucket, setBucket] = React.useState<string>(() => {
        try {
            return filters.bucket || localStorage.getItem('reports:bucket') || 'hour';
        } catch {
            return filters.bucket || 'hour';
        }
    });
    React.useEffect(() => {
        if (filters.bucket && filters.bucket !== bucket) {
            setBucket(filters.bucket);
            try {
                localStorage.setItem('reports:bucket', filters.bucket);
            } catch {
                /* ignore storage errors */
            }
        }
        if (!filters.bucket) {
            try {
                const stored = localStorage.getItem('reports:bucket');
                if (stored && stored !== bucket) setBucket(stored);
            } catch {
                /* ignore storage errors */
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.bucket]);

    const onBucketChange = (value: string) => {
        setBucket(value);
        try {
            localStorage.setItem('reports:bucket', value);
        } catch {
            /* ignore storage errors */
        }
        router.get(
            '/reports',
            { ...filters, bucket: value, start, end },
            { preserveState: true, preserveScroll: true },
        );
    };
    const onRangeChange = (r?: DateRange) => {
        setRange(r);
        const s = r?.from ? r.from.toISOString().slice(0, 10) : '';
        const e = r?.to ? r.to.toISOString().slice(0, 10) : '';
        if (s) setStart(s);
        if (e) setEnd(e);
        if (s && e) {
            const params = { ...filters, start: s, end: e };
            router.get('/reports', params, { preserveState: true, preserveScroll: true });
        }
    };

    const uptimeData = React.useMemo(
        () => uptimeTrend.map((d) => ({ time: d.bucket, pct: d.uptime_percent || 0 })),
        [uptimeTrend],
    );
    const respData = React.useMemo(
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
                <div>
                    <p className="text-xs text-muted-foreground">
                        Last updated {updatedAt.toLocaleTimeString()}
                    </p>
                </div>
                <FiltersBar
                    bucket={bucket}
                    start={start}
                    end={end}
                    range={range}
                    onBucketChange={onBucketChange}
                    onRangeChange={onRangeChange}
                />
                <SummaryCards summary={summary} />
                <TrendCharts uptimeData={uptimeData} respData={respData} />
                <Leaderboards leaderboard={leaderboard} mostDown={mostDown} />
                <ResponseTables responseStats={responseStats} slowestCurrent={slowestCurrent} />
                <CertificatesAndFlapping certificates={certificates} flapping={flapping} />
                <AvailabilityAndDowntime
                    availabilityAll={availabilityAll}
                    downtimeWindows={downtimeWindows}
                />
            </div>
        </>
    );
}
