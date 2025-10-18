import * as React from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

type FlashMessage = {
    type?: 'success' | 'error' | 'info' | 'warning' | 'loading';
    title: string;
    description?: string;
} | null;

type PageProps = { flash?: FlashMessage };

export function FlashToaster() {
    const { props } = usePage<PageProps>();
    const last = React.useRef<{ title?: string; description?: string; type?: string }>({});

    React.useEffect(() => {
        const msg = props.flash;
        if (!msg?.title) return;

        const changed =
            last.current.title !== msg.title ||
            last.current.description !== msg.description ||
            last.current.type !== msg.type;

        if (!changed) return;

        const type = msg.type ?? 'success';
        const options = msg.description ? { description: msg.description } : undefined;

        switch (type) {
            case 'success':
                toast.success(msg.title, options);
                break;
            case 'error':
                toast.error(msg.title, options);
                break;
            case 'info':
                toast.info(msg.title, options);
                break;
            case 'warning':
                toast.warning(msg.title, options);
                break;
            case 'loading':
                toast.loading(msg.title, options);
                break;
            default:
                toast(msg.title, options);
        }

        last.current = { title: msg.title, description: msg.description, type: msg.type };
    }, [props.flash?.title, props.flash?.description, props.flash?.type]);

    return null;
}
