import { TooltipProvider } from '@/components/ui/tooltip';
import { FlashToaster } from '@/components/ui/flash-toaster';
import { FooterBar } from '@/components/layout/footer';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 grid place-items-center">
          <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            {children}
          </div>
        </main>
        <FooterBar />
      </div>
      <FlashToaster />
    </TooltipProvider>
  );
}
