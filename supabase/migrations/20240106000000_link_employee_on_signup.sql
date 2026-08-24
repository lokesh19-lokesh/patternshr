-- Enhance the new user trigger to automatically link invited employees to their workspace
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  emp_record RECORD;
  emp_role_id UUID;
BEGIN
  -- Insert the basic profile
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);

  -- Check if this email exists in the employees table
  SELECT * INTO emp_record FROM public.employees WHERE email = new.email LIMIT 1;
  
  IF FOUND THEN
    -- Get the default Employee role for that company
    SELECT id INTO emp_role_id FROM public.roles 
    WHERE company_id = emp_record.company_id AND name ILIKE 'employee' LIMIT 1;
    
    -- If an 'Employee' role isn't found, try 'Employee' or 'employee' literally, or fallback to any role (usually this won't happen)
    IF emp_role_id IS NULL THEN
      SELECT id INTO emp_role_id FROM public.roles WHERE company_id = emp_record.company_id LIMIT 1;
    END IF;

    -- Insert into company_members so they bypass onboarding
    INSERT INTO public.company_members (company_id, user_id, role_id)
    VALUES (emp_record.company_id, new.id, emp_role_id)
    ON CONFLICT (company_id, user_id) DO NOTHING;
    
    -- Update the employee record to link the profile ID
    UPDATE public.employees SET profile_id = new.id WHERE id = emp_record.id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
