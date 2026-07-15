'use client';

import { useActionState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { updateBranch } from '@/lib/settings/actions';
import type { DatabaseBranch } from '@/types/database';

interface BranchesTabProps {
  branches: Array<Pick<DatabaseBranch, 'id' | 'name' | 'code' | 'address' | 'phone' | 'email' | 'is_active'>>;
}

const initialState = undefined as { error?: string; success?: string } | undefined;

function BranchCard({ branch }: { branch: BranchesTabProps['branches'][number] }) {
  const [state, formAction, pending] = useActionState(updateBranch, initialState);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{branch.name}</CardTitle>
            <CardDescription>Code: {branch.code}</CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        <form action={formAction} className="max-w-lg space-y-4">
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

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-emerald-600">{state.success}</p>
          )}

          <Button type="submit" disabled={pending} size="sm">
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function BranchesTab({ branches }: BranchesTabProps) {
  if (branches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
          <CardDescription>Manage your organization branches.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No branches found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Branches</h3>
        <p className="text-sm text-muted-foreground">
          Manage your organization branches. Each branch can have its own contact information.
        </p>
      </div>

      <div className="grid gap-6">
        {branches.map((branch) => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
      </div>
    </div>
  );
}
