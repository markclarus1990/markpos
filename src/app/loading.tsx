import { LoadingSkeleton } from '@/components/shared/loading-skeleton';

export default function RootLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <LoadingSkeleton variant="page" />
    </div>
  );
}
