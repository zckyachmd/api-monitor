import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, CheckCircle2, Timer, AlertTriangle } from 'lucide-react';
import type { Summary } from '@/pages/Reports/types';

export function SummaryCards({ summary }: { summary: Summary }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="group">
                    <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground transition-transform duration-150 group-hover:scale-110" />
                        <CardTitle>Total Monitors</CardTitle>
                    </div>
                    <CardDescription>Tracked by latest status</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{summary.total}</CardContent>
            </Card>
            <Card>
                <CardHeader className="group">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 transition-transform duration-150 group-hover:scale-110" />
                        <CardTitle className="text-green-600 dark:text-green-400">Up</CardTitle>
                    </div>
                    <CardDescription>Currently operational</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{summary.up}</CardContent>
            </Card>
            <Card>
                <CardHeader className="group">
                    <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform duration-150 group-hover:scale-110" />
                        <CardTitle className="text-amber-600 dark:text-amber-400">Pending</CardTitle>
                    </div>
                    <CardDescription>Checks in progress</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{summary.pending}</CardContent>
            </Card>
            <Card>
                <CardHeader className="group">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 transition-transform duration-150 group-hover:scale-110" />
                        <CardTitle className="text-red-600 dark:text-red-400">Down</CardTitle>
                    </div>
                    <CardDescription>Currently failing</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{summary.down}</CardContent>
            </Card>
        </div>
    );
}
