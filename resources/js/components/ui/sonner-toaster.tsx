import React from 'react';
import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function getTheme(): 'light' | 'dark' {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function Toaster(props: ToasterProps) {
    const [theme, setTheme] = React.useState<'light' | 'dark'>(getTheme());

    React.useEffect(() => {
        const observer = new MutationObserver(() => setTheme(getTheme()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="h-4 w-4" />,
                info: <InfoIcon className="h-4 w-4" />,
                warning: <TriangleAlertIcon className="h-4 w-4" />,
                error: <OctagonXIcon className="h-4 w-4" />,
                loading: <Loader2Icon className="h-4 w-4 animate-spin" />,
            }}
            style={{
                // Map Sonner to Tailwind v4 CSS variables for shadcn/ui consistency
                ['--normal-bg' as string]: 'var(--popover)',
                ['--normal-text' as string]: 'var(--popover-foreground)',
                ['--normal-border' as string]: 'var(--border)',
                ['--border-radius' as string]: 'var(--radius)',
            }}
            {...props}
        />
    );
}
