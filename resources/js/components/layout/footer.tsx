export function FooterBar() {
  return (
    <footer className="border-t bg-background/50">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} API Monitor</span>
        <span>Built with Laravel, Inertia, React, shadcn/ui</span>
      </div>
    </footer>
  );
}

