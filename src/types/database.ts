export interface DatabaseProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrganization {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  currency_code: string;
  country_code: string;
  settings: Record<string, unknown>;
  subscription_tier: string;
  trial_ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBranch {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseRole {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabasePermission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
  created_at: string;
}

export interface DatabaseOrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;
}

export interface DatabaseBranchStaff {
  id: string;
  branch_id: string;
  user_id: string;
  role_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  joinedAt: string;
}

export interface AppContext {
  user: AuthUser | null;
  organization: DatabaseOrganization | null;
  branch: DatabaseBranch | null;
  organizations: Array<Pick<DatabaseOrganization, 'id' | 'name' | 'slug'>>;
  branches: Array<Pick<DatabaseBranch, 'id' | 'name' | 'code'>>;
  isLoading: boolean;
}
