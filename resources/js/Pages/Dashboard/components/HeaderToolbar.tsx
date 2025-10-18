import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RefreshCw, Timer } from 'lucide-react';

type Props = {
    updatedAt: Date;
    loading: boolean;
    autoMs: number;
    onRefresh: () => void;
    onChangeAuto: (ms: number) => void;
};

export function HeaderToolbar({ updatedAt, loading, autoMs, onRefresh, onChangeAuto }: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Quick overview per monitor</p>
                <p className="text-xs text-muted-foreground mt-1">Last updated {updatedAt.toLocaleTimeString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                <Button variant="outline" className="gap-2" aria-label="Refresh now" onClick={onRefresh} disabled={loading}>
                    <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} />
                    <span className="hidden sm:inline">Refresh</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2" aria-label="Auto refresh options">
                            <Timer className="h-4 w-4" />
                            <span>
                                {(() => {
                                    const map: Record<number, string> = {
                                        0: 'Off',
                                        30000: '30s',
                                        60000: '1m',
                                        300000: '5m',
                                        600000: '10m',
                                        900000: '15m',
                                        1800000: '30m',
                                    };
                                    return map[autoMs] ?? `${Math.round(autoMs / 1000)}s`;
                                })()}
                            </span>
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
                            <DropdownMenuItem key={String(ms)} onSelect={(e) => { e.preventDefault(); onChangeAuto(ms as number); }}>
                                <div className="flex w-full items-center justify-between">
                                    <span>{label as string}</span>
                                    {autoMs === ms && <span className="text-xs text-muted-foreground">(active)</span>}
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

