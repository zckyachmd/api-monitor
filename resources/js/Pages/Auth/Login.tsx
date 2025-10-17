import { Head, Link } from '@inertiajs/react';
import AuthLayout from '@/layouts/AuthLayout';
import type { PageWithLayout } from '@/types/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const Login: PageWithLayout = () => {
  return (
    <>
      <Head title="Sign In" />
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Welcome back. Enter your credentials to continue.</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button className="w-full" type="submit">Sign In</Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Don’t have an account? <Link href="#" className="text-foreground underline">Sign up</Link>
        </p>
      </div>
    </>
  );
};

Login.layout = (page) => <AuthLayout>{page}</AuthLayout>;

export default Login;

