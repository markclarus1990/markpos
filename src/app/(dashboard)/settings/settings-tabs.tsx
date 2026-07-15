'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { GeneralTab } from '@/components/settings/general-tab';
import { RegionalTab } from '@/components/settings/regional-tab';
import { BranchesTab } from '@/components/settings/branches-tab';
import type { DatabaseOrganization, DatabaseBranch } from '@/types/database';

interface SettingsTabsProps {
  organization: Pick<DatabaseOrganization, 'id' | 'name' | 'email' | 'phone' | 'address' | 'timezone' | 'currency_code'>;
  branches: Array<Pick<DatabaseBranch, 'id' | 'name' | 'code' | 'address' | 'phone' | 'email' | 'is_active'>>;
  orgId: string;
  activeBranchId: string | null;
  roles: Array<{ id: string; name: string }>;
  staffMap: Record<string, Array<{
    id: string; userId: string; roleId: string | null; isActive: boolean;
    userIdentifier: string; roleName: string | null;
  }>>;
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'regional', label: 'Regional' },
  { id: 'branches', label: 'Branches' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsTabs({ organization, branches, orgId, activeBranchId, roles, staffMap }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors min-h-[44px]',
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'general' && <GeneralTab organization={organization} />}
      {activeTab === 'regional' && <RegionalTab organization={organization} />}
      {activeTab === 'branches' && (
        <BranchesTab
          branches={branches}
          orgId={orgId}
          activeBranchId={activeBranchId}
          roles={roles}
          staffMap={staffMap}
        />
      )}
    </div>
  );
}
