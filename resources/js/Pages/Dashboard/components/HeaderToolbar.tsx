type Props = {
    updatedAt: Date;
};

export function HeaderToolbar({ updatedAt }: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Quick overview per monitor</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Last updated {updatedAt.toLocaleTimeString()}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end" />
        </div>
    );
}
