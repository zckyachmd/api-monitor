<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Defines the props that are shared by default.
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'locale' => app()->getLocale(),
            // Unified flash message format: { type?: 'success'|'error'|'info'|'warning'|'loading', title: string, description?: string }
            'flash' => fn() => $request->session()->get('flash'),
            'auth' => [
                'user' => $request->user(),
            ],
        ]);
    }
}
