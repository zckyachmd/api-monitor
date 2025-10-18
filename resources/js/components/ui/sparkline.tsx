import * as React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip } from 'recharts';
import ChartTooltip from '@/components/ui/chart-tooltip';

type SparklineProps = {
    data: { value: number; time?: string | number }[];
    colorVar?: string; // CSS var color, e.g., 'var(--primary)'
    height?: number;
    withTooltip?: boolean;
};

export function Sparkline({
    data,
    colorVar = 'var(--primary)',
    height = 40,
    withTooltip = false,
}: SparklineProps) {
    const gradientId = React.useId();
    const [hovered, setHovered] = React.useState(false);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart
                data={data}
                margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                onMouseMove={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colorVar} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={colorVar} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 'auto']} />
                {withTooltip && hovered && (
                    <RTooltip
                        content={<ChartTooltip valueKey="value" valueLabel="Avg" valueUnit="ms" />}
                    />
                )}
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={colorVar}
                    fill={`url(#${gradientId})`}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
