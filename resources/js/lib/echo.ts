import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export type ChannelLike = {
    listen: (event: string, callback: (e: unknown) => unknown) => unknown;
    stopListening: (event: string) => unknown;
};

export type EchoLike = {
    channel: (name: string) => ChannelLike;
};

declare global {
    interface Window {
        Echo?: EchoLike;
        Pusher?: typeof Pusher;
        __echoInitialized?: boolean;
    }
}

let echoInstance: EchoLike | null = null;

export function getEcho(): EchoLike | null {
    if (typeof window === 'undefined') return null;
    if (window.Echo) return window.Echo;

    if (!window.__echoInitialized) {
        try {
            window.Pusher = Pusher;

            const enabled = String(import.meta.env.VITE_REVERB_ENABLED ?? 'true') === 'true';
            if (!enabled) {
                window.__echoInitialized = true;
                return null;
            }

            const scheme = String(
                import.meta.env.VITE_REVERB_SCHEME ??
                    (window.location.protocol === 'https:' ? 'https' : 'http'),
            );
            const host = String(import.meta.env.VITE_REVERB_HOST ?? window.location.hostname);
            const port = Number(
                import.meta.env.VITE_REVERB_PORT ?? (scheme === 'https' ? 443 : 8080),
            );
            const key = String(import.meta.env.VITE_REVERB_APP_KEY ?? '');

            if (!key) {
                window.__echoInitialized = true;
                return null;
            }

            echoInstance = new Echo({
                broadcaster: 'reverb',
                key,
                wsHost: host,
                wsPort: port,
                wssPort: port,
                forceTLS: scheme === 'https',
                enabledTransports: ['ws', 'wss'],
                disableStats: true,
            }) as unknown as EchoLike;

            window.Echo = echoInstance;
            window.__echoInitialized = true;
        } catch {
            window.__echoInitialized = true;
            echoInstance = null;
        }
    }

    return window.Echo ?? echoInstance;
}

// Auto-initialize in browser contexts
if (typeof window !== 'undefined' && !window.__echoInitialized) {
    getEcho();
}

export default getEcho;
