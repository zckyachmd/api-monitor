export function StatusDot({ status }: { status: number }) {
    const color =
        status === 1
            ? 'bg-green-500'
            : status === 0
              ? 'bg-red-500'
              : status === 2
                ? 'bg-amber-500'
                : 'bg-blue-500';
    const ping = status === 1 || status === 0;
    return (
        <span className="relative inline-flex h-2.5 w-2.5">
            {ping && (
                <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-ping`} />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
        </span>
    );
}

