'use client';

import { useState, useActionState } from 'react';
import { Store, Building2 } from 'lucide-react';
import { createOrganization } from '@/lib/auth/actions';
import { generateSlug } from '@/lib/validations/slug';
import { Button } from '@/components/ui/button';
import { OnboardingSteps } from '@/components/shared/onboarding-steps';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [state, formAction] = useActionState(createOrganization, undefined);

  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [countryCode, setCountryCode] = useState('PH');
  const [currencyCode, setCurrencyCode] = useState('PHP');
  const [timezone, setTimezone] = useState('Asia/Manila');

  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    if (!slugEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setSlug(value);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
            <Store className="size-6 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Set up your business
            </h1>
            <p className="text-sm text-muted-foreground">
              Let&apos;s get your business ready on MarkPOS
            </p>
          </div>
        </div>

        <OnboardingSteps currentStep={step} totalSteps={2} />

        {state?.error && (
          <div
            className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2">
                <Building2 className="size-5 text-primary" />
                <h2 className="text-lg font-medium">Organization details</h2>
              </div>

              <div className="space-y-2">
                <label htmlFor="orgName" className="text-sm font-medium">
                  Business name
                </label>
                <input
                  id="orgName"
                  name="orgName"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                  placeholder="My Business"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="orgSlug" className="text-sm font-medium">
                  URL slug
                </label>
                <div className="flex items-center gap-1 rounded-lg border bg-background px-3 text-sm text-muted-foreground">
                  <span className="shrink-0">markpos.app/</span>
                  <input
                    id="orgSlug"
                    name="orgSlug"
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex h-10 flex-1 bg-transparent px-0 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none min-h-[44px]"
                    placeholder="my-business"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="orgCountryCode" className="text-sm font-medium">
                    Country
                  </label>
                  <select
                    id="orgCountryCode"
                    name="orgCountryCode"
                    required
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                  >
                    <option value="PH">Philippines</option>
                    <option value="US">United States</option>
                    <option value="SG">Singapore</option>
                    <option value="AU">Australia</option>
                    <option value="JP">Japan</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="orgCurrencyCode" className="text-sm font-medium">
                    Currency
                  </label>
                  <select
                    id="orgCurrencyCode"
                    name="orgCurrencyCode"
                    required
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                  >
                    <option value="PHP">PHP (&#8369;)</option>
                    <option value="USD">USD (&#36;)</option>
                    <option value="SGD">SGD (S&#36;)</option>
                    <option value="AUD">AUD (A&#36;)</option>
                    <option value="JPY">JPY (&#165;)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="orgTimezone" className="text-sm font-medium">
                  Timezone
                </label>
                <select
                  id="orgTimezone"
                  name="orgTimezone"
                  required
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                >
                  <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="America/Chicago">America/Chicago (UTC-6)</option>
                  <option value="America/Denver">America/Denver (UTC-7)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="Australia/Sydney">Australia/Sydney (UTC+11)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                </select>
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={() => setStep(2)}
              >
                Next step
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <input type="hidden" name="orgName" value={orgName} />
              <input type="hidden" name="orgSlug" value={slug} />
              <input type="hidden" name="orgCountryCode" value={countryCode} />
              <input type="hidden" name="orgCurrencyCode" value={currencyCode} />
              <input type="hidden" name="orgTimezone" value={timezone} />

              <div className="flex items-center gap-3 pb-2">
                <Building2 className="size-5 text-primary" />
                <h2 className="text-lg font-medium">First branch</h2>
              </div>

              <div className="space-y-2">
                <label htmlFor="branchName" className="text-sm font-medium">
                  Branch name
                </label>
                <input
                  id="branchName"
                  name="branchName"
                  type="text"
                  required
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                  placeholder="Main Branch"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="branchCode" className="text-sm font-medium">
                  Branch code
                </label>
                <input
                  id="branchCode"
                  name="branchCode"
                  type="text"
                  required
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                  placeholder="MAIN-001"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="branchAddress" className="text-sm font-medium">
                  Address
                </label>
                <input
                  id="branchAddress"
                  name="branchAddress"
                  type="text"
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="branchPhone" className="text-sm font-medium">
                    Phone
                  </label>
                  <input
                    id="branchPhone"
                    name="branchPhone"
                    type="tel"
                    className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                    placeholder="+63 912 345 6789"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="branchEmail" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="branchEmail"
                    name="branchEmail"
                    type="email"
                    className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                    placeholder="branch@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" size="lg">
                  Complete setup
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
