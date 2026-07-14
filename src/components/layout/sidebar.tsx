'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ChevronLeft,
  Menu,
  X,
  Store,
  Tags,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-media-query';
import { useAppContext } from '@/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
] as const;

const secondaryNav = [
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Brands', href: '/brands', icon: Bookmark },
] as const;

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { organization, isLoading } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Store className="size-4 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground leading-tight">
              MarkPOS
            </span>
            {isLoading ? (
              <Skeleton className="h-3 w-20" />
            ) : organization ? (
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {organization.name}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="size-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {!isCollapsed && (
          <div className="px-3 pt-4 pb-1">
            <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              Catalog
            </p>
          </div>
        )}

        {secondaryNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="size-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-sidebar-foreground"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'size-5 shrink-0 transition-transform',
              isCollapsed && 'rotate-180',
            )}
          />
          {!isCollapsed && <span>Collapse</span>}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-3 z-50"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar shadow-lg">
              <div className="flex h-14 items-center justify-end px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X className="size-5" />
                </Button>
              </div>
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside
      className={cn(
        'hidden border-r bg-sidebar transition-all duration-200 md:flex md:flex-col',
        isCollapsed ? 'md:w-16' : 'md:w-64',
      )}
    >
      {sidebarContent}
    </aside>
  );
}
