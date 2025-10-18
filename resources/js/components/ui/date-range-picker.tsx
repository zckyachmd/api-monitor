import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

type DateRangePickerProps = {
    value?: DateRange;
    onChange?: (range?: DateRange) => void;
    numberOfMonths?: number;
    className?: string;
    placeholder?: string;
    presets?: boolean;
};

function formatDisplay(d?: Date) {
    if (!d) return '';
    try {
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return d.toISOString().slice(0, 10);
    }
}

function startOfDay(d: Date) {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
}

function endOfDay(d: Date) {
    const nd = new Date(d);
    nd.setHours(23, 59, 59, 999);
    return nd;
}

function addDays(d: Date, days: number) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
}

function firstDayOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function lastDayOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function DateRangePicker({
    value,
    onChange,
    className,
    placeholder,
    presets = true,
}: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState<DateRange | undefined>(value);
    const [isSmUp, setIsSmUp] = React.useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(min-width: 640px)').matches;
    });
    const [mobileView, setMobileView] = React.useState<'calendar' | 'presets'>('calendar');
    React.useEffect(() => {
        if (open) setDraft(value);
    }, [open, value]);
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(min-width: 640px)');
        const handler = (e: MediaQueryListEvent | MediaQueryList) => {
            const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
            setIsSmUp(matches);
            if (matches) setMobileView('calendar');
        };
        if (mq.addEventListener) mq.addEventListener('change', handler as (ev: Event) => void);
        else mq.addListener(handler as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
        handler(mq);
        return () => {
            if (mq.removeEventListener)
                mq.removeEventListener('change', handler as (ev: Event) => void);
            else
                mq.removeListener(
                    handler as (this: MediaQueryList, ev: MediaQueryListEvent) => void,
                );
        };
    }, []);
    // Respect localStorage if previously set and no value provided by parent
    React.useEffect(() => {
        if (!open) return;
        if (value?.from && value?.to) return;
        try {
            const raw = localStorage.getItem('reports:dateRange');
            if (!raw) return;
            const parsed = JSON.parse(raw) as { from?: string; to?: string };
            const from = parsed.from ? new Date(parsed.from) : undefined;
            const to = parsed.to ? new Date(parsed.to) : undefined;
            if (from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
                const range = { from, to } satisfies DateRange;
                setDraft(range);
                onChange?.(range);
            }
        } catch {
            // ignore bad storage
        }
    }, [open, onChange, value?.from, value?.to]);
    const canApply = !!(draft?.from && draft?.to);
    const handleApply = () => {
        if (canApply) {
            onChange?.(draft);
            try {
                const s = draft?.from?.toISOString().slice(0, 10);
                const e = draft?.to?.toISOString().slice(0, 10);
                if (s && e)
                    localStorage.setItem('reports:dateRange', JSON.stringify({ from: s, to: e }));
            } catch {
                // ignore
            }
            setOpen(false);
        }
    };
    const handleClear = () => {
        setDraft(undefined);
        onChange?.(undefined);
        try {
            localStorage.removeItem('reports:dateRange');
        } catch {
            // ignore
        }
    };

    const presetActions: { key: string; label: string; getRange: () => DateRange }[] =
        React.useMemo(() => {
            const today = new Date();
            const startOfWeek = (d: Date) => {
                const nd = startOfDay(d);
                // Monday as start of week
                const day = nd.getDay(); // 0..6 (Sun..Sat)
                const diff = (day === 0 ? -6 : 1) - day; // Move to Monday
                return addDays(nd, diff);
            };
            const endOfWeek = (d: Date) => addDays(startOfWeek(d), 6);
            const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);
            const startOfQuarter = (d: Date) => {
                const q = Math.floor(d.getMonth() / 3); // 0..3
                return new Date(d.getFullYear(), q * 3, 1);
            };

            return [
                {
                    key: 'today',
                    label: 'Today',
                    getRange: () => ({ from: startOfDay(today), to: endOfDay(today) }),
                },
                {
                    key: 'yesterday',
                    label: 'Yesterday',
                    getRange: () => {
                        const y = addDays(startOfDay(today), -1);
                        return { from: y, to: endOfDay(y) };
                    },
                },
                {
                    key: 'thisWeek',
                    label: 'This week',
                    getRange: () => ({ from: startOfWeek(today), to: endOfDay(today) }),
                },
                {
                    key: 'lastWeek',
                    label: 'Last week',
                    getRange: () => {
                        const lwEnd = endOfWeek(addDays(today, -7));
                        return { from: startOfWeek(lwEnd), to: endOfDay(lwEnd) };
                    },
                },
                {
                    key: 'last7',
                    label: 'Last 7 days',
                    getRange: () => ({ from: addDays(startOfDay(today), -6), to: endOfDay(today) }),
                },
                {
                    key: 'last14',
                    label: 'Last 14 days',
                    getRange: () => ({
                        from: addDays(startOfDay(today), -13),
                        to: endOfDay(today),
                    }),
                },
                {
                    key: 'last30',
                    label: 'Last 30 days',
                    getRange: () => ({
                        from: addDays(startOfDay(today), -29),
                        to: endOfDay(today),
                    }),
                },
                {
                    key: 'last90',
                    label: 'Last 90 days',
                    getRange: () => ({
                        from: addDays(startOfDay(today), -89),
                        to: endOfDay(today),
                    }),
                },
                {
                    key: 'thisMonth',
                    label: 'This month',
                    getRange: () => ({
                        from: startOfDay(firstDayOfMonth(today)),
                        to: endOfDay(today),
                    }),
                },
                {
                    key: 'lastMonth',
                    label: 'Last month',
                    getRange: () => {
                        const firstThis = firstDayOfMonth(today);
                        const lastPrev = addDays(firstThis, -1);
                        return {
                            from: startOfDay(firstDayOfMonth(lastPrev)),
                            to: endOfDay(lastDayOfMonth(lastPrev)),
                        };
                    },
                },
                {
                    key: 'thisQuarter',
                    label: 'This quarter',
                    getRange: () => ({
                        from: startOfDay(startOfQuarter(today)),
                        to: endOfDay(today),
                    }),
                },
                {
                    key: 'ytd',
                    label: 'Year to date',
                    getRange: () => ({ from: startOfDay(startOfYear(today)), to: endOfDay(today) }),
                },
                {
                    key: 'thisYear',
                    label: 'This year',
                    getRange: () => ({ from: startOfDay(startOfYear(today)), to: endOfDay(today) }),
                },
            ];
        }, []);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!value?.from}
                    className={cn(
                        'data-[empty=true]:text-muted-foreground w-full sm:w-[320px] justify-start text-left font-normal',
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">
                        {value?.from ? (
                            value.to ? (
                                <>
                                    {formatDisplay(value.from)} – {formatDisplay(value.to)}
                                </>
                            ) : (
                                <>{formatDisplay(value.from)}</>
                            )
                        ) : (
                            <>{placeholder ?? 'Pick a date range'}</>
                        )}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[calc(100vw-2rem)] sm:w-[min(100vw-2rem,600px)] md:w-[min(100vw-4rem,680px)] lg:w-[min(100vw-6rem,720px)] max-w-[100vw] max-h-[80vh] overflow-y-auto overflow-x-hidden"
                align="start"
            >
                <div className="flex w-full flex-col gap-2 sm:gap-0 sm:flex-row sm:items-stretch sm:divide-x divide-border divide-y sm:divide-y-0">
                    {presets && (
                        <div className="sm:hidden px-2 pt-2">
                            <div className="inline-flex rounded-md border">
                                <button
                                    type="button"
                                    className={cn(
                                        'px-3 py-1 text-xs rounded-l-md',
                                        mobileView === 'calendar'
                                            ? 'bg-accent text-accent-foreground'
                                            : 'bg-background',
                                    )}
                                    onClick={() => setMobileView('calendar')}
                                >
                                    Calendar
                                </button>
                                <button
                                    type="button"
                                    className={cn(
                                        'px-3 py-1 text-xs rounded-r-md border-l',
                                        mobileView === 'presets'
                                            ? 'bg-accent text-accent-foreground'
                                            : 'bg-background',
                                    )}
                                    onClick={() => setMobileView('presets')}
                                >
                                    Presets
                                </button>
                            </div>
                        </div>
                    )}
                    {presets && (
                        <div
                            className={cn(
                                'p-3 sm:w-[180px] md:w-[200px] lg:w-[220px]',
                                isSmUp ? 'block' : mobileView === 'presets' ? 'block' : 'hidden',
                            )}
                        >
                            <ScrollArea
                                orientation={'vertical'}
                                className="w-full h-[240px] sm:h-[340px] md:h-[360px] lg:h-[400px]"
                                viewportClassName={'overflow-y-auto'}
                            >
                                <div className={cn('gap-2 sm:gap-1 pr-2 flex flex-col w-auto')}>
                                    {presetActions.map((p) => (
                                        <Button
                                            key={p.key}
                                            variant="ghost"
                                            className={cn('justify-start text-left w-full')}
                                            onClick={() => {
                                                const r = p.getRange();
                                                setDraft(r);
                                                // auto-apply on preset select
                                                onChange?.(r);
                                                try {
                                                    const s = r.from?.toISOString().slice(0, 10);
                                                    const e = r.to?.toISOString().slice(0, 10);
                                                    if (s && e)
                                                        localStorage.setItem(
                                                            'reports:dateRange',
                                                            JSON.stringify({ from: s, to: e }),
                                                        );
                                                } catch {
                                                    // ignore
                                                }
                                                setOpen(false);
                                            }}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                    {/* Single calendar (all viewports) */}
                    <div
                        className={cn(
                            'p-2 sm:p-3 sm:flex-1',
                            isSmUp ? 'block' : mobileView === 'calendar' ? 'block' : 'hidden',
                        )}
                    >
                        <Calendar
                            mode="range"
                            selected={draft}
                            onSelect={(range) => {
                                if (!range) return setDraft(undefined);
                                const f = range.from ? startOfDay(range.from) : undefined;
                                const t = range.to ? endOfDay(range.to) : undefined;
                                if (f && t) {
                                    // ensure from <= to
                                    const from = f <= t ? f : startOfDay(range.to!);
                                    const to = f <= t ? t : endOfDay(range.from!);
                                    setDraft({ from, to });
                                } else if (f && !t) {
                                    setDraft({ from: f, to: undefined });
                                } else {
                                    setDraft(undefined);
                                }
                            }}
                            numberOfMonths={1}
                            className="w-full max-w-full mx-auto overflow-x-hidden [--cell-size:calc((100vw-3rem)/7)] sm:[--cell-size:1.4rem] md:[--cell-size:1.5rem] lg:[--cell-size:1.6rem]"
                            classNames={{
                                day_selected:
                                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring',
                                day_range_start: 'bg-primary text-primary-foreground',
                                day_range_end: 'bg-primary text-primary-foreground',
                                day_range_middle: 'bg-primary/10 text-foreground',
                                day_today: 'border border-primary',
                            }}
                        />
                    </div>
                </div>
                <div className="border-t bg-background px-3 py-2 flex justify-end gap-2 sticky bottom-0">
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        Clear
                    </Button>
                    <Button size="sm" onClick={handleApply} disabled={!canApply}>
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export type { DateRange };
