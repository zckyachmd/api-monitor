import * as React from 'react';
import type { TooltipProps } from 'recharts';

type ValueType = number | string;
type NameType = string;

export type ChartTooltipProps = TooltipProps<ValueType, NameType> & {
    valueKey?: string;
    valueLabel?: string;
    valueUnit?: string;
    labelFormatter?: (label: unknown) => React.ReactNode;
    valueFormatter?: (value: unknown) => React.ReactNode;
};

const defaultLabelFormatter = (label: unknown) => {
    if (typeof label === 'string' || typeof label === 'number') {
        const d = new Date(String(label));
        return isNaN(d.getTime()) ? String(label) : d.toLocaleString();
    }
    return label as React.ReactNode;
};

export function ChartTooltip({
    active,
    label,
    payload,
    valueKey,
    valueLabel = 'Value',
    valueUnit = '',
    labelFormatter = defaultLabelFormatter,
    valueFormatter,
}: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    const items = (payload ?? []) as Array<{ dataKey?: string | number; value?: unknown }>;
    let record: { dataKey?: string | number; value?: unknown } | undefined = items[0];
    if (valueKey) {
        const match = items.find((p) => p.dataKey === valueKey);
        if (match) record = match;
    }

    const val: unknown = record?.value;
    const formattedValue = (() => {
        if (valueFormatter) return valueFormatter(val);
        if (typeof val === 'number') return `${val}${valueUnit ? ` ${valueUnit}` : ''}`;
        if (typeof val === 'string') return `${val}${valueUnit ? ` ${valueUnit}` : ''}`;
        return String(val);
    })();

    return (
        <div
            className="rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md"
            role="tooltip"
        >
            <div className="text-xs text-muted-foreground">{labelFormatter(label)}</div>
            <div className="text-sm font-medium">
                {valueLabel}: {formattedValue}
            </div>
        </div>
    );
}

export default ChartTooltip;
