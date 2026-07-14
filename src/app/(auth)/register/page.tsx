'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signUp } from '@/lib/auth/actions';
import { AuthFormWrapper } from '@/components/shared/auth-form-wrapper';
import { PasswordInput } from '@/components/shared/password-input';

export default function RegisterPage() {
  const [state, formAction] = useActionState(signUp, undefined);

  return (
    <AuthFormWrapper
      title="Create your account"
      subtitle="Get started with MarkPOS"
      error={state?.error ?? null}
      success={state?.success ?? null}
      action={formAction}
      footer={
        <p>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {!state?.success && (
        <>
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Full name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              placeholder="Create a password"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              placeholder="Confirm your password"
            />
          </div>
        </>
      )}
    </AuthFormWrapper>
  );
}
