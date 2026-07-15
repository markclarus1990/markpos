'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Store } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/providers/auth-provider';
import { useAuthStore } from '@/stores/auth-store';
import { setActiveBranch } from '@/lib/branches/actions';

export function BranchSwitcher({ className }: { className?: string }) {
  const { branch, branches } = useAppContext();
  const setStoreBranch = useAuthStore((s) => s.setBranch);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleSwitch = useCallback(
    async (branchId: string) => {
      setOpen(false);
      const formData = new FormData();
      formData.set('branchId', branchId);
      const result = await setActiveBranch(undefined, formData);
      if (result.branchId) {
        setStoreBranch(result.branchId);
        startTransition(() => {
          router.refresh();
        });
      }
    },
    [router, setStoreBranch],
  );

  if (!branch) return null;

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-sm font-normal"
        onClick={() => setOpen(!open)}
        aria-label="Switch branch"
        aria-expanded={open}
      >
        <Store className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="max-w-[100px] truncate">{branch.name}</span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover p-1 shadow-md">
            <div className="border-b px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">
                Select Branch
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSwitch(b.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm min-h-[44px] transition-colors',
                    b.id === branch.id
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'hover:bg-accent/50 text-foreground',
                  )}
                >
                  <Store className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{b.name}</span>
                  {b.id === branch.id && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
