import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import AdminLayout from '@/layouts/AdminLayout';
import { Toaster } from '@/components/ui/sonner-toaster';
import type React from 'react';

const pages = import.meta.glob('./Pages/**/*.tsx');

createInertiaApp({
    title: (title?: string) =>
        title
            ? `${title} - ${import.meta.env.VITE_APP_NAME || 'Laravel'}`
            : import.meta.env.VITE_APP_NAME || 'Laravel',
    resolve: async (name) => {
        const importPage = pages[`./Pages/${name}.tsx`];
        if (!importPage) throw new Error(`Page not found: ${name}`);
        type PageComponent = React.ComponentType & {
            layout?: (page: React.ReactNode) => React.ReactNode;
        };
        const mod = (await importPage()) as { default: PageComponent };
        const Page = mod.default;
        Page.layout = Page.layout || ((page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>);
        return Page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el as HTMLElement);
        root.render(
            <>
                <App {...props} />
                <Toaster richColors closeButton position="top-right" />
            </>,
        );
    },
    progress: { color: '#4B5563' },
});
