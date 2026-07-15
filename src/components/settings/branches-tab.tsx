'use client';

import { useState, useActionState } from 'react';
import { Plus, UserPlus, Power, PowerOff, UserMinus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { updateBranch } from '@/lib/settings/actions';
import {
  createBranch,
  toggleBranchStatus,
  assignStaff,
  updateStaffRole,
  deactivateStaff,
} from '@/lib/branches/actions';
import type { DatabaseBranch } from '@/types/database';

interface StaffMember {
  id: string;
  userId: string;
  roleId: string | null;
  isActive: boolean;
  userIdentifier: string;
  roleName: string | null;
}

interface BranchesTabProps {
  branches: Array<
    Pick<
      DatabaseBranch,
      'id' | 'name' | 'code' | 'address' | 'phone' | 'email' | 'is_active'
    >
  >;
  orgId: string;
  activeBranchId: string | null;
  roles: Array<{ id: string; name: string }>;
  staffMap: Record<string, StaffMember[]>;
}

const initialState = undefined as
  | { error?: string; success?: string }
  | undefined;

function BranchCard({
  branch,
  activeBranchId,
  branches,
  roles,
  initialStaff,
}: {
  branch: BranchesTabProps['branches'][number];
  activeBranchId: string | null;
  branches: BranchesTabProps['branches'];
  roles: BranchesTabProps['roles'];
  initialStaff: StaffMember[];
}) {
  const [editState, editAction, editPending] = useActionState(
    updateBranch,
    initialState,
  );
  const [statusState, statusAction, statusPending] = useActionState(
    toggleBranchStatus,
    initialState,
  );
  const [staffState, staffAction, staffPending] = useActionState(
    assignStaff,
    initialState,
  );
  const [, staffRoleAction] = useActionState(
    updateStaffRole,
    initialState,
  );
  const [, deactivateStaffAction] =
    useActionState(deactivateStaff, initialState);

  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [replacementBranchId, setReplacementBranchId] = useState('');
  const [staff] = useState<StaffMember[]>(initialStaff);

  const isCurrentBranch = branch.id === activeBranchId;
  const hasMultipleActiveBranches =
    branches.filter((b) => b.is_active).length > 1;

  const activeBranches = branches.filter(
    (b) => b.is_active && b.id !== branch.id,
  );

  return (
    <Card className={!branch.is_active ? 'opacity-75' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{branch.name}</CardTitle>
            <CardDescription>Code: {branch.code}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isCurrentBranch && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Selected
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                branch.is_active
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                  : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
              }`}
            >
              {branch.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Edit Form */}
        <form action={editAction} className="max-w-lg space-y-4">
          <input type="hidden" name="id" value={branch.id} />

          <div className="space-y-2">
            <Label htmlFor={`name-${branch.id}`}>Branch Name</Label>
            <Input
              id={`name-${branch.id}`}
              name="name"
              defaultValue={branch.name}
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`code-${branch.id}`}>Branch Code</Label>
            <Input
              id={`code-${branch.id}`}
              name="code"
              defaultValue={branch.code}
              required
              maxLength={20}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`email-${branch.id}`}>Email</Label>
            <Input
              id={`email-${branch.id}`}
              name="email"
              type="email"
              defaultValue={branch.email ?? ''}
              maxLength={254}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`phone-${branch.id}`}>Phone</Label>
            <Input
              id={`phone-${branch.id}`}
              name="phone"
              type="tel"
              defaultValue={branch.phone ?? ''}
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`address-${branch.id}`}>Address</Label>
            <Textarea
              id={`address-${branch.id}`}
              name="address"
              defaultValue={branch.address ?? ''}
              maxLength={500}
              rows={2}
            />
          </div>

          {editState?.error && (
            <p className="text-sm text-destructive">{editState.error}</p>
          )}
          {editState?.success && (
            <p className="text-sm text-emerald-600">{editState.success}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={editPending} size="sm">
              {editPending ? 'Saving...' : 'Save'}
            </Button>

            {/* Deactivate/Reactivate */}
            <form action={statusAction}>
              <input type="hidden" name="branchId" value={branch.id} />
              <input
                type="hidden"
                name="isActive"
                value={(!branch.is_active).toString()}
              />
              {branch.is_active ? (
                <Dialog
                  open={showDeactivateConfirm}
                  onOpenChange={setShowDeactivateConfirm}
                >
                  <DialogTrigger>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30"
                    >
                      <PowerOff className="mr-1 size-3" />
                      Deactivate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Deactivate Branch</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to deactivate{' '}
                        <strong>{branch.name}</strong>?
                        {hasMultipleActiveBranches && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Users with this branch selected will be switched to
                            the replacement branch.
                          </p>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    {hasMultipleActiveBranches && activeBranches.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor={`replacement-${branch.id}`}>
                          Replacement Branch
                        </Label>
                        <select
                          id={`replacement-${branch.id}`}
                          value={replacementBranchId}
                          onChange={(e) =>
                            setReplacementBranchId(e.target.value)
                          }
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select a branch...</option>
                          {activeBranches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDeactivateConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={
                          statusPending ||
                          (hasMultipleActiveBranches &&
                            !replacementBranchId)
                        }
                        onClick={() => {
                          if (replacementBranchId) {
                            const input =
                              document.createElement('input');
                            input.type = 'hidden';
                            input.name = 'replacementBranchId';
                            input.value = replacementBranchId;
                            (
                              document.querySelector(
                                'form [name="branchId"][value="' +
                                  branch.id +
                                  '"]',
                              ) as HTMLFormElement
                            )?.closest('form')?.appendChild(input);
                          }
                        }}
                      >
                        {statusPending
                          ? 'Deactivating...'
                          : 'Confirm Deactivation'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="text-emerald-600 border-emerald-600/30"
                >
                  <Power className="mr-1 size-3" />
                  Reactivate
                </Button>
              )}
            </form>
          </div>

          {statusState?.error && (
            <p className="text-sm text-destructive">{statusState.error}</p>
          )}
          {statusState?.success && (
            <p className="text-sm text-emerald-600">
              {statusState.success}
            </p>
          )}
        </form>

        {/* Staff Management */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Staff</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateStaff(!showCreateStaff)}
            >
              <UserPlus className="mr-1 size-3" />
              Assign Staff
            </Button>
          </div>

          {showCreateStaff && (
            <form action={staffAction} className="mb-4 space-y-3 rounded-lg border p-3">
              <input type="hidden" name="branchId" value={branch.id} />
              <div className="space-y-2">
                <Label htmlFor={`staff-user-${branch.id}`}>User ID</Label>
                <Input
                  id={`staff-user-${branch.id}`}
                  name="userId"
                  required
                  placeholder="Enter user UUID"
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the user ID of an existing organization member.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`staff-role-${branch.id}`}>Role</Label>
                <select
                  id={`staff-role-${branch.id}`}
                  name="roleId"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              {staffState?.error && (
                <p className="text-sm text-destructive">{staffState.error}</p>
              )}
              {staffState?.success && (
                <p className="text-sm text-emerald-600">
                  {staffState.success}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={staffPending} size="sm">
                  {staffPending ? 'Assigning...' : 'Assign'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateStaff(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No staff assigned to this branch.
            </p>
          ) : (
            <div className="space-y-2">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    !s.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {s.userIdentifier}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.roleName ?? 'No role'}
                      {!s.isActive && ' (Inactive)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={staffRoleAction}>
                      <input
                        type="hidden"
                        name="assignmentId"
                        value={s.id}
                      />
                      <select
                        name="roleId"
                        defaultValue={s.roleId ?? ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const form = e.target.form;
                            if (form) {
                              const submit = form.querySelector(
                                'button[type="submit"]',
                              ) as HTMLButtonElement;
                              if (submit) submit.click();
                            }
                          }
                        }}
                        className="rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="">No role</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="hidden">
                        Update
                      </button>
                    </form>
                    {s.isActive && (
                      <form action={deactivateStaffAction}>
                        <input
                          type="hidden"
                          name="assignmentId"
                          value={s.id}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          disabled={false}
                        >
                          <UserMinus className="size-3" />
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BranchesTab({
  branches,
  orgId: _orgId,
  activeBranchId,
  roles,
  staffMap,
}: BranchesTabProps) {
  const [createState, createAction, createPending] = useActionState(
    createBranch,
    initialState,
  );
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Branches</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization branches. Each branch can have its own
            contact information, staff, and status.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1 size-4" />
          Add Branch
        </Button>
      </div>

      {/* Create Branch Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New Branch</CardTitle>
            <CardDescription>
              Create a new branch for your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAction} className="max-w-lg space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Branch Name</Label>
                <Input
                  id="new-name"
                  name="name"
                  required
                  maxLength={200}
                  placeholder="e.g., Downtown Store"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-code">Branch Code</Label>
                <Input
                  id="new-code"
                  name="code"
                  required
                  maxLength={20}
                  className="uppercase"
                  placeholder="e.g., DT-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  name="email"
                  type="email"
                  maxLength={254}
                  placeholder="branch@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-phone">Phone</Label>
                <Input
                  id="new-phone"
                  name="phone"
                  type="tel"
                  maxLength={30}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-address">Address</Label>
                <Textarea
                  id="new-address"
                  name="address"
                  maxLength={500}
                  rows={2}
                  placeholder="123 Main St, City"
                />
              </div>

              {createState?.error && (
                <p className="text-sm text-destructive">{createState.error}</p>
              )}
              {createState?.success && (
                <p className="text-sm text-emerald-600">
                  {createState.success}
                </p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={createPending} size="sm">
                  {createPending ? 'Creating...' : 'Create Branch'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {branches.length === 0 && !showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>No Branches</CardTitle>
            <CardDescription>
              Create your first branch to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              activeBranchId={activeBranchId}
              branches={branches}
              roles={roles}
              initialStaff={staffMap[branch.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
