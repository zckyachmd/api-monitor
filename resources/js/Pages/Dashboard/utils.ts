export function pct(v?: number | null) {
    return typeof v === 'number' ? `${v.toFixed(2)}%` : '—';
}

export function statusColorVar(status: number): string {
    if (status === 1) return 'var(--primary)';
    if (status === 2) return '#f59e0b';
    if (status === 0) return 'var(--destructive)';
    return 'var(--muted-foreground)';
}

