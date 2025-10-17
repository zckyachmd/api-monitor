<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full antialiased">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
        <link rel="apple-touch-icon" href="/favicon.ico">

        @viteReactRefresh
        <script>
            (function() {
                try {
                    var storageKey = 'theme';
                    var stored = localStorage.getItem(storageKey);
                    var mql = window.matchMedia('(prefers-color-scheme: dark)');
                    var system = mql.matches ? 'dark' : 'light';
                    var theme = stored || system;
                    var root = document.documentElement;
                    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
                    root.style.colorScheme = theme;
                } catch (e) {
                    // no-op
                }
            })();
        </script>

        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="min-h-screen bg-background text-foreground">
        @inertia
    </body>
</html>
