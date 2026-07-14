'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signIn } from '@/lib/auth/actions';
import { AuthFormWrapper } from '@/components/shared/auth-form-wrapper';
import { PasswordInput } from '@/components/shared/password-input';

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, undefined);

  return (
    <AuthFormWrapper
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      error={state?.error ?? null}
      success={null}
      action={formAction}
      footer={
        <div className="space-y-2">
          <p>
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      }
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium"
        >
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
        <label
          htmlFor="password"
          className="text-sm font-medium"
        >
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
        />
      </div>
    </AuthFormWrapper>
  );
}
