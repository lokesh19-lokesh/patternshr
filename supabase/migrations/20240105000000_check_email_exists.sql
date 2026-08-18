-- Create a secure function to check if an email exists in the auth.users table
-- This is intentionally bypassing the anti-enumeration feature of Supabase Auth
-- for the forgot password flow to improve UX as requested.

CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = lookup_email
  );
$$;

-- Grant execution to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;
