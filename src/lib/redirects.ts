export function isSafeRedirect(destination: string): boolean {
  if (!destination || destination.startsWith('//')) return false;
  if (destination.startsWith('/')) return true;
  if (destination.startsWith('?')) return true;
  return false;
}

export function getRedirectPath(
  searchParams: URLSearchParams,
  fallback = '/dashboard',
): string {
  const redirectTo = searchParams.get('redirectTo');
  if (redirectTo && isSafeRedirect(redirectTo)) {
    return redirectTo;
  }
  return fallback;
}
