'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { sendPasswordReset } from '@/lib/auth/actions';
import { AuthFormWrapper } from '@/components/shared/auth-form-wrapper';

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(sendPasswordReset, undefined);

  return (
    <AuthFormWrapper
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      error={state?.error ?? null}
      success={state?.success ?? null}
      action={formAction}
      footer={
        <p>
          Remember your password?{' '}
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
      )}
    </AuthFormWrapper>
  );
}
