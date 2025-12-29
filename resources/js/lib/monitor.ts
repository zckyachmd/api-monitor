export function formatMonitorUrl(value?: string | null) {
    if (typeof value !== 'string') return '-';
    const trimmed = value.trim();
    if (!trimmed) return '-';

    const hasScheme = /^[a-z][a-z0-9+\-.]*:\/\//i.test(trimmed);
    if (!hasScheme) return trimmed;

    try {
        const parsed = new URL(trimmed);
        return parsed.hostname ? trimmed : '-';
    } catch {
        return '-';
    }
}
