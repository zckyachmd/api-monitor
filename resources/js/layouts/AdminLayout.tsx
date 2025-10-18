import { TooltipProvider } from '@/components/ui/tooltip';
import { Navbar } from '@/components/layout/navbar';
import { FooterBar } from '@/components/layout/footer';
import { FlashToaster } from '@/components/ui/flash-toaster';

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
            <FlashToaster />
        </TooltipProvider>
    );
}
