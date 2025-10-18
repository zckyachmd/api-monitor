import { Link, usePage, router } from '@inertiajs/react';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { Button } from '@/components/ui/button';
import { User, CreditCard, LogOut, Settings, ActivitySquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type PageProps = {
  auth?: { user?: { name?: string | null; email?: string | null; avatar_url?: string | null } | null };
};

export function Navbar() {
  const { props } = usePage<PageProps>();
  const user = props.auth?.user ?? null;
  const initials = (user?.name || user?.email || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <ActivitySquare className="h-4 w-4" />
            <span>API Monitor</span>
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link href="/reports" className="text-muted-foreground hover:text-foreground">Reports</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open user menu" className="overflow-hidden rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    {user?.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user?.name || user?.email || 'User'} />
                    ) : (
                      <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {user?.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user?.name || user?.email || 'User'} />
                      ) : (
                        <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="grid text-xs">
                      <span className="font-medium leading-tight">{user?.name || 'User'}</span>
                      <span className="text-muted-foreground leading-tight">{user?.email || 'user@example.com'}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" /> Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); router.post('/logout'); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
