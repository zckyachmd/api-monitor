import type React from 'react';

export type PageWithLayout<P = {}> = React.FC<P> & {
  layout?: (page: React.ReactNode) => React.ReactNode;
};

