import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { CalendarClock, FileSpreadsheet } from 'lucide-react';
import * as React from 'react';

type Props = {
    bucket: string;
    start: string;
    end: string;
    range: DateRange | undefined;
    onBucketChange: (value: string) => void;
    onRangeChange: (r?: DateRange) => void;
};

export function FiltersBar({ bucket, start, end, range, onBucketChange, onRangeChange }: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Reports</h1>
                <p className="text-sm text-muted-foreground">Uptime Kuma metrics visualization</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto">
                    <span className="sr-only" id="date-range-label">
                        Date range
                    </span>
                    <DateRangePicker
                        value={range}
                        onChange={onRangeChange}
                        className="w-full sm:w-[320px]"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Bucket selector"
                            className="shrink-0"
                        >
                            <CalendarClock className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        {[
                            ['minute', 'Minute'],
                            ['hour', 'Hour'],
                            ['day', 'Day'],
                        ].map(([value, label]) => (
                            <DropdownMenuItem
                                key={value}
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onBucketChange(value);
                                }}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <span>{label}</span>
                                    {bucket === value && (
                                        <span className="text-xs text-muted-foreground">
                                            (selected)
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        {[
                            ['Uptime Trend', 'uptimeTrend'],
                            ['Response Time Trend', 'responseTimeTrend'],
                            ['Top Uptime', 'leaderboard'],
                            ['Most Down', 'mostDown'],
                            ['Never Down', 'neverDown'],
                            ['Response Stats', 'responseStats'],
                            ['Slowest Current', 'slowestCurrent'],
                            ['Certificates', 'certificates'],
                            ['Flapping', 'flapping'],
                            ['Availability (All)', 'availabilityAll'],
                            ['Downtime Windows', 'downtimeWindows'],
                        ].map(([label, key]) => (
                            <DropdownMenuItem key={key} asChild>
                                <a
                                    href={`/reports/export?dataset=${key}&bucket=${bucket}&start=${start}&end=${end}`}
                                    target="_self"
                                >
                                    {label}
                                </a>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
