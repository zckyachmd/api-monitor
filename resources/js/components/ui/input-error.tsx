import * as React from 'react';
import { cn } from '@/lib/utils';

type InputErrorProps = {
  message?: string | null;
  id?: string;
  className?: string;
};

export function InputError({ message, id, className }: InputErrorProps) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={cn('mt-1 text-xs text-destructive', className)}>
      {message}
    </p>
  );
}

