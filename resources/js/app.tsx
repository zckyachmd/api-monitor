import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import AdminLayout from '@/layouts/AdminLayout';

const pages = import.meta.glob('./Pages/**/*.tsx');

createInertiaApp({
  title: (title?: string) => (title ? `${title} - ${import.meta.env.VITE_APP_NAME || 'Laravel'}` : import.meta.env.VITE_APP_NAME || 'Laravel'),
  resolve: async (name) => {
    const importPage = pages[`./Pages/${name}.tsx`];
    if (!importPage) throw new Error(`Page not found: ${name}`);
    const module: any = await importPage();
    const Page = module.default as any;
    Page.layout = Page.layout || ((page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>);
    return Page;
  },
  setup({ el, App, props }) {
    const root = createRoot(el as HTMLElement);
    root.render(<App {...props} />);
  },
  progress: { color: '#4B5563' },
});
