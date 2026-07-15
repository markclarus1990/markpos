'use client';

import { useActionState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { updateRegionalSettings } from '@/lib/settings/actions';
import { VALID_CURRENCIES, VALID_TIMEZONES } from '@/lib/settings/schemas';
import type { DatabaseOrganization } from '@/types/database';

interface RegionalTabProps {
  organization: Pick<DatabaseOrganization, 'currency_code' | 'timezone'>;
}

const initialState = undefined as { error?: string; success?: string; currencyWarning?: string } | undefined;

export function RegionalTab({ organization }: RegionalTabProps) {
  const [state, formAction, pending] = useActionState(updateRegionalSettings, initialState);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>
            Configure currency and timezone for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="max-w-lg space-y-5">
            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency</Label>
              <select
                id="currencyCode"
                name="currencyCode"
                defaultValue={organization.currency_code}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {VALID_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-xs text-amber-600">
                Changing the currency changes how monetary values are displayed. It does not convert existing sales or historical amounts.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={organization.timezone}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {VALID_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                The timezone determines daily sales boundaries, report periods, dashboard dates, and receipt timestamps.
              </p>
            </div>

            <input type="hidden" name="currentCurrency" value={organization.currency_code} />

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-sm text-emerald-600">{state.success}</p>
            )}
            {state?.currencyWarning && (
              <p className="text-sm text-amber-600">{state.currencyWarning}</p>
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
