import { Head, useForm } from '@inertiajs/react';
import AuthLayout from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputError } from '@/components/ui/input-error';

export default function Login() {
    const form = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/login', {
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <>
            <Head title="Sign In" />
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold">Sign in</h1>
                    <p className="text-sm text-muted-foreground">
                        Welcome back! Sign in to continue.
                    </p>
                </div>
                <form className="space-y-4" onSubmit={submit}>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                            autoComplete="email"
                            aria-invalid={!!form.errors.email}
                            aria-describedby={form.errors.email ? 'email-error' : undefined}
                        />
                        <InputError id="email-error" message={form.errors.email} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            required
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                            autoComplete="current-password"
                            aria-invalid={!!form.errors.password}
                            aria-describedby={form.errors.password ? 'password-error' : undefined}
                        />
                        <InputError id="password-error" message={form.errors.password} />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.data.remember}
                                onCheckedChange={(v) => form.setData('remember', Boolean(v))}
                                aria-label="Remember me"
                            />
                            <span>Remember me</span>
                        </label>
                    </div>
                    <Button className="w-full" type="submit" disabled={form.processing}>
                        {form.processing ? 'Signing in…' : 'Sign In'}
                    </Button>
                </form>
                {/* <p className="text-center text-xs text-muted-foreground">
          Don’t have an account? <Link href="#" className="text-foreground underline">Sign up</Link>
        </p> */}
            </div>
        </>
    );
}

(Login as unknown as { layout?: (page: React.ReactNode) => React.ReactNode }).layout = (page: React.ReactNode) => (
    <AuthLayout>{page}</AuthLayout>
);
