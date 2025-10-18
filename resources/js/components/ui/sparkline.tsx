import * as React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip } from 'recharts';

type SparklineProps = {
  data: { value: number; time?: any }[];
  colorVar?: string; // CSS var color, e.g., 'var(--primary)'
  height?: number;
  withTooltip?: boolean;
};

export function Sparkline({ data, colorVar = 'var(--primary)', height = 40, withTooltip = false }: SparklineProps) {
  const gradientId = React.useId();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colorVar} stopOpacity={0.35} />
            <stop offset="95%" stopColor={colorVar} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" hide />
        <YAxis hide domain={[0, 'auto']} />
        {withTooltip && (
          <RTooltip
            contentStyle={{
              background: 'var(--popover)',
              color: 'var(--popover-foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)'
            }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
            formatter={(v: any) => [`${v} ms`, 'Avg']}
            labelFormatter={(l: any) => {
              const d = new Date(l);
              return isNaN(d.getTime()) ? String(l) : d.toLocaleString();
            }}
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
