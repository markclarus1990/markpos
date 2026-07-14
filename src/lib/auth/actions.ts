'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  organizationSetupSchema,
  branchSetupSchema,
} from '@/lib/validations/auth';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { generateSlug } from '@/lib/validations/slug';

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  return url;
}

function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  return key;
}

async function createServerClientForAction() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // ignore in Server Components
        }
      },
    },
  });
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createServerClientForAction();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  const headersList = await headers();
  const referer = headersList.get('referer') ?? '';
  const redirectTo = new URL(referer, 'http://localhost:3000').searchParams.get('redirectTo');

  redirect(redirectTo ?? '/dashboard');
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const raw = {
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createServerClientForAction();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { success: 'Account created! Check your email to verify your account.' };
}

export async function signOut() {
  const supabase = await createServerClientForAction();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function sendPasswordReset(_prevState: unknown, formData: FormData) {
  const raw = {
    email: formData.get('email'),
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createServerClientForAction();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { success: 'Check your email for a password reset link.' };
}

export async function updatePassword(_prevState: unknown, formData: FormData) {
  const raw = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createServerClientForAction();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { success: 'Password updated successfully.' };
}

export async function createOrganization(
  _prevState: unknown,
  formData: FormData,
) {
  const rawOrg = {
    name: formData.get('orgName'),
    slug: formData.get('orgSlug'),
    timezone: formData.get('orgTimezone'),
    currencyCode: formData.get('orgCurrencyCode'),
    countryCode: formData.get('orgCountryCode'),
  };

  const rawBranch = {
    name: formData.get('branchName'),
    code: formData.get('branchCode'),
    address: formData.get('branchAddress'),
    phone: formData.get('branchPhone'),
    email: formData.get('branchEmail'),
  };

  const orgParsed = organizationSetupSchema.safeParse(rawOrg);
  if (!orgParsed.success) {
    return { error: orgParsed.error.issues[0]?.message ?? 'Invalid organization input' };
  }

  const branchParsed = branchSetupSchema.safeParse(rawBranch);
  if (!branchParsed.success) {
    return { error: branchParsed.error.issues[0]?.message ?? 'Invalid branch input' };
  }

  const supabase = await createServerClientForAction();
  const resolvedSlug = orgParsed.data.slug || generateSlug(orgParsed.data.name);

  const { data, error } = await supabase.rpc('create_organization_onboarding', {
    org_name: orgParsed.data.name,
    org_slug: resolvedSlug,
    org_timezone: orgParsed.data.timezone,
    org_currency_code: orgParsed.data.currencyCode,
    org_country_code: orgParsed.data.countryCode,
    branch_name: branchParsed.data.name,
    branch_code: branchParsed.data.code,
    branch_address: branchParsed.data.address || null,
    branch_phone: branchParsed.data.phone || null,
    branch_email: branchParsed.data.email || null,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  if (!data?.success) {
    return { error: data?.error ?? 'Failed to create organization' };
  }

  redirect('/dashboard');
}
