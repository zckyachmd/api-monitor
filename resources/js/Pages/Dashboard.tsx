import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <>
      <Head title="Dashboard" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">API Monitor</h1>
        </div>
        <p className="text-muted-foreground">Inertia + React + Tailwind (Vite) + shadcn/ui</p>
        <div className="flex gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>
    </>
  );
}
