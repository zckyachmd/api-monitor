import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner-toaster';
import { Navbar } from '@/components/layout/navbar';
import { FooterBar } from '@/components/layout/footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6">{children}</div>
        </main>
        <FooterBar />
      </div>
      <Toaster richColors closeButton position="top-right" />
    </TooltipProvider>
  );
}

