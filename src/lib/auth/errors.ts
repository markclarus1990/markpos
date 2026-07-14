const authErrorMessages: Record<string, string> = {
  'Invalid login credentials':
    'Invalid email or password. Please check your credentials and try again.',
  'Email not confirmed':
    'Please verify your email address before signing in. Check your inbox for the confirmation link.',
  'Invalid email':
    'No account found with this email address.',
  'User already registered':
    'An account with this email already exists. Please sign in instead.',
  'Password should be at least 6 characters':
    'Password must be at least 6 characters long.',
  'weak_password':
    'Please choose a stronger password.',
  'signup_disabled':
    'Registration is currently disabled. Please contact support.',
  'Too many requests':
    'Too many attempts. Please try again later.',
  'Invalid refresh token':
    'Your session has expired. Please sign in again.',
  'Session expired':
    'Your session has expired. Please sign in again.',
  'Invalid verification link':
    'This verification link is invalid or has expired.',
  'Email rate limit exceeded':
    'Too many email requests. Please wait a moment and try again.',
};

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'string' && authErrorMessages[error]) {
    return authErrorMessages[error]!;
  }

  if (error && typeof error === 'object') {
    const err = error as { message?: string; code?: string; status?: number };

    if (err.message && authErrorMessages[err.message]) {
      return authErrorMessages[err.message]!;
    }

    if (err.code && authErrorMessages[err.code]) {
      return authErrorMessages[err.code]!;
    }

    if (err.message) {
      return err.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}
