import { AppShell } from '@/components/layout/app-shell';
import { ServerActiveBranch } from '@/components/branches/server-active-branch';
import { Suspense } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ServerActiveBranch />
      </Suspense>
      <AppShell>{children}</AppShell>
    </>
  );
}
