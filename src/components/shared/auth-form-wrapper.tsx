'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  action: (formData: FormData) => void;
  error?: string | null;
  success?: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" isLoading={pending} size="lg">
      {pending ? 'Please wait...' : 'Continue'}
    </Button>
  );
}

export function AuthFormWrapper({
  title,
  subtitle,
  children,
  footer,
  action,
  error,
  success,
}: AuthFormWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
          <Store className="size-6 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success" role="status">
          {success}
        </div>
      )}

      {success ? (
        <Link href="/login" className="block">
          <Button type="button" className="w-full" size="lg" variant="primary">
            Continue to sign in
          </Button>
        </Link>
      ) : (
        <form action={action} className="space-y-4">
          {children}
          <SubmitButton />
        </form>
      )}

      <div className="text-center text-sm text-muted-foreground">
        {footer}
      </div>
    </div>
  );
}
