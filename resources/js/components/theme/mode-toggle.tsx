import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const storageKey = 'theme';
type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = theme;
}

export function ModeToggle() {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const stored = localStorage.getItem(storageKey) as Theme | null;
        const t = stored || getSystemTheme();
        setTheme(t);
        applyTheme(t);

        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const current = localStorage.getItem(storageKey) as Theme | null;
            if (!current) {
                const sys = getSystemTheme();
                setTheme(sys);
                applyTheme(sys);
            }
        };
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    function toggle() {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(storageKey, next);
        setTheme(next);
        applyTheme(next);
    }

    return (
        <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggle}
            className="h-9 w-9 rounded-full"
        >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
    );
}
