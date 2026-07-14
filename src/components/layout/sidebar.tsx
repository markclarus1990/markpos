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
import { motion } from 'framer-motion';
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

type NavItemType = (typeof navigation)[number] | (typeof secondaryNav)[number];

function NavItem({
  item,
  isCollapsed,
  pathname,
  onClick,
}: {
  item: NavItemType;
  isCollapsed: boolean;
  pathname: string;
  onClick: () => void;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
      onClick={onClick}
      title={isCollapsed ? item.name : undefined}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <item.icon className="size-5 shrink-0" />
      {!isCollapsed && <span>{item.name}</span>}
    </Link>
  );
}

interface SidebarContentProps {
  isCollapsed: boolean;
  pathname: string;
  onToggle: () => void;
  onNavClick: () => void;
}

function SidebarContent({ isCollapsed, pathname, onToggle, onNavClick }: SidebarContentProps) {
  const { organization, isLoading } = useAppContext();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <Store className="size-4 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-sidebar-foreground leading-tight">
              MarkPOS
            </span>
            {isLoading ? (
              <Skeleton className="h-3 w-20" />
            ) : organization ? (
              <span className="truncate text-xs text-sidebar-foreground/60 max-w-[140px]">
                {organization.name}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {navigation.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isCollapsed={isCollapsed}
            pathname={pathname}
            onClick={onNavClick}
          />
        ))}

        {!isCollapsed && (
          <div className="px-3 pt-4 pb-1">
            <p className="text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">
              Catalog
            </p>
          </div>
        )}

        {secondaryNav.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isCollapsed={isCollapsed}
            pathname={pathname}
            onClick={onNavClick}
          />
        ))}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground',
            isCollapsed && 'justify-center',
          )}
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'size-4 shrink-0 transition-transform duration-200',
              isCollapsed && 'rotate-180',
            )}
          />
          {!isCollapsed && <span>Collapse</span>}
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <motion.div
              className="fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar shadow-lg"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
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
              <SidebarContent
                isCollapsed={false}
                pathname={pathname}
                onToggle={onToggle}
                onNavClick={() => setMobileOpen(false)}
              />
            </motion.aside>
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
      <SidebarContent
        isCollapsed={isCollapsed}
        pathname={pathname}
        onToggle={onToggle}
        onNavClick={() => {}}
      />
    </aside>
  );
}
