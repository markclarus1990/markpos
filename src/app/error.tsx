'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <ErrorState
        title="Something went wrong"
        message="An unexpected error occurred. Please try again."
        onRetry={reset}
        className="max-w-md"
      />
    </div>
  );
}
