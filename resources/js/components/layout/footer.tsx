export function FooterBar() {
    return (
        <footer className="border-t bg-background/50">
            <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:py-0">
                <div className="flex flex-col items-center justify-between gap-1 sm:flex-row sm:h-12 text-xs text-muted-foreground">
                    <span className="order-2 sm:order-1">
                        &copy; {new Date().getFullYear()} API Monitor
                    </span>
                    <span className="order-1 sm:order-2 flex flex-wrap items-center justify-center sm:justify-end gap-x-1">
                        <span className="whitespace-nowrap">
                            Developed by{' '}
                            <a
                                href="https://s.id/zckyachmd"
                                target="_blank"
                                rel="noreferrer"
                                className="underline decoration-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                            >
                                Zacky Achmad
                            </a>
                        </span>
                    </span>
                </div>
            </div>
        </footer>
    );
}
