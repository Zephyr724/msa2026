import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { type ReactNode } from 'react';
import { router } from './router.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { queryClient } from './queryClient.ts';

export function Providers(): ReactNode {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
