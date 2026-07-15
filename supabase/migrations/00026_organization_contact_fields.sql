-- ============================================================
-- ORGANIZATIONS: Add contact fields for Store Settings MVP
-- ============================================================

-- Safely add email column (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN email TEXT;
  END IF;
END;
$$;

-- Safely add phone column (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN phone TEXT;
  END IF;
END;
$$;

-- Safely add address column (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN address TEXT;
  END IF;
END;
$$;
