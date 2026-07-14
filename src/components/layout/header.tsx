'use client';

import { useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ThemeSwitcher } from '@/components/shared/theme-switcher';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/providers/auth-provider';
import { useIsMobile } from '@/hooks/use-media-query';
import { signOut } from '@/lib/auth/actions';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, organization, branch } = useAppContext();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'flex h-14 items-center gap-3 border-b bg-background px-4 md:px-6',
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {organization && (
          <>
            <span className="truncate text-sm font-medium text-foreground">
              {organization.name}
            </span>
            {branch && (
              <>
                <span className="text-muted-foreground/40 shrink-0">/</span>
                <span className="truncate text-sm text-muted-foreground">
                  {branch.name}
                </span>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <ThemeSwitcher />

        {user && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="User menu"
              aria-expanded={menuOpen}
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {user.displayName?.charAt(0)?.toUpperCase() ?? user.email.charAt(0).toUpperCase()}
              </div>
              {!isMobile && (
                <>
                  <span className="max-w-[120px] truncate text-sm">
                    {user.displayName ?? user.email}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                </>
              )}
            </Button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border bg-popover p-1 shadow-md">
                  <div className="border-b px-3 py-2">
                    <p className="text-sm font-medium">
                      {user.displayName ?? 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 min-h-[44px]"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
