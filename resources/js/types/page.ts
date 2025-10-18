import type React from 'react';

export type PageWithLayout<P = Record<string, never>> = React.FC<P> & {
    layout?: (page: React.ReactNode) => React.ReactNode;
};
