import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner-toaster';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen grid place-items-center">
        <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          {children}
        </div>
      </div>
      <Toaster richColors closeButton position="top-right" />
    </TooltipProvider>
  );
}

