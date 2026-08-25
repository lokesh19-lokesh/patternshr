-- Function to automatically link logged-in user to their company workspace based on email
CREATE OR REPLACE FUNCTION public.claim_employee_membership()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_emp RECORD;
  v_desig RECORD;
  v_role_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email FROM public.profiles WHERE id = v_user_id;
  END IF;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No email found');
  END IF;

  -- Find employee record matching this user's email
  SELECT * INTO v_emp 
  FROM public.employees 
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_user_email)) 
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'No employee record found for email');
  END IF;

  -- Determine role
  IF v_emp.designation_id IS NOT NULL THEN
    SELECT * INTO v_desig FROM public.designations WHERE id = v_emp.designation_id;
    IF FOUND AND (v_desig.name ILIKE '%founder%' OR v_desig.name ILIKE '%ceo%' OR v_desig.name ILIKE '%admin%') THEN
      SELECT id INTO v_role_id FROM public.roles 
      WHERE company_id = v_emp.company_id AND name ILIKE '%admin%' LIMIT 1;
    END IF;
  END IF;

  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles 
    WHERE company_id = v_emp.company_id AND name ILIKE '%employee%' LIMIT 1;
  END IF;

  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles 
    WHERE company_id = v_emp.company_id LIMIT 1;
  END IF;

  -- Upsert company_members
  INSERT INTO public.company_members (company_id, user_id, role_id)
  VALUES (v_emp.company_id, v_user_id, v_role_id)
  ON CONFLICT (company_id, user_id) DO UPDATE 
  SET role_id = EXCLUDED.role_id 
  WHERE company_members.role_id IS NULL;

  -- Link profile_id on employee table
  UPDATE public.employees 
  SET profile_id = v_user_id 
  WHERE id = v_emp.id;

  RETURN jsonb_build_object('success', true, 'company_id', v_emp.company_id, 'role_id', v_role_id);
END;
$$;
