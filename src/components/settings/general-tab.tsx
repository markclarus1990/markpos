'use client';

import { useActionState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { updateGeneralSettings } from '@/lib/settings/actions';
import type { DatabaseOrganization } from '@/types/database';

interface GeneralTabProps {
  organization: Pick<DatabaseOrganization, 'name' | 'email' | 'phone' | 'address'>;
}

const initialState = undefined as { error?: string; success?: string } | undefined;

export function GeneralTab({ organization }: GeneralTabProps) {
  const [state, formAction, pending] = useActionState(updateGeneralSettings, initialState);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Your organization&apos;s basic information displayed across the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="max-w-lg space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={organization.name}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={organization.email ?? ''}
                maxLength={254}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Used for customer contact and receipt information.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Business Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={organization.phone ?? ''}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Used for customer contact and receipt information.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={organization.address ?? ''}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Displayed on receipts and reports.
              </p>
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-sm text-emerald-600">{state.success}</p>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
