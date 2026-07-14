'use client';

import { useActionState } from 'react';
import { updatePassword } from '@/lib/auth/actions';
import { AuthFormWrapper } from '@/components/shared/auth-form-wrapper';
import { PasswordInput } from '@/components/shared/password-input';

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(updatePassword, undefined);

  return (
    <AuthFormWrapper
      title="Set new password"
      subtitle="Enter your new password below"
      error={state?.error ?? null}
      success={state?.success ?? null}
      action={formAction}
      footer={
        <p>
          Password updated?{' '}
          <a
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </a>
        </p>
      }
    >
      {!state?.success && (
        <>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New password
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm new password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              placeholder="Confirm new password"
            />
          </div>
        </>
      )}
    </AuthFormWrapper>
  );
}
