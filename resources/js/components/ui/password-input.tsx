import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input, type InputProps } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type PasswordInputProps = Omit<InputProps, 'type'> & {
    toggleAriaLabelShow?: string;
    toggleAriaLabelHide?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    (
        {
            className,
            toggleAriaLabelShow = 'Show password',
            toggleAriaLabelHide = 'Hide password',
            ...props
        },
        ref,
    ) => {
        const [visible, setVisible] = React.useState(false);
        const aria = visible ? toggleAriaLabelHide : toggleAriaLabelShow;

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    type={visible ? 'text' : 'password'}
                    className={cn('pr-10', className)}
                    {...props}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={aria}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={() => setVisible((v) => !v)}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
        );
    },
);
PasswordInput.displayName = 'PasswordInput';
