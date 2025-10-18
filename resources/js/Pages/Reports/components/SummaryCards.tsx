import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Summary } from '@/pages/Reports/types';

export function SummaryCards({ summary }: { summary: Summary }) {
    return (
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
                <CardContent className="text-3xl font-bold">{summary.up}</CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-amber-600 dark:text-amber-400">Pending</CardTitle>
                    <CardDescription>Checks in progress</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{summary.pending}</CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Down</CardTitle>
                    <CardDescription>Currently failing</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{summary.down}</CardContent>
            </Card>
        </div>
    );
}
