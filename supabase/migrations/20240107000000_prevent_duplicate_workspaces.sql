-- Prevent duplicate workspace names and duplicate memberships

-- 1. Create a case-insensitive unique index on company names
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_unique_name ON public.companies (LOWER(TRIM(name)));

-- 2. Update create_company_with_admin to enforce workspace name uniqueness and single-membership restriction
CREATE OR REPLACE FUNCTION public.create_company_with_admin(new_company_name VARCHAR)
RETURNS UUID AS $$
DECLARE
    new_company_id UUID;
    admin_role_id UUID;
    trimmed_name VARCHAR;
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    trimmed_name := TRIM(new_company_name);

    IF LENGTH(trimmed_name) < 2 THEN
        RAISE EXCEPTION 'Company name must be at least 2 characters.';
    END IF;

    -- Check if user already belongs to a workspace
    IF EXISTS (SELECT 1 FROM public.company_members WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Your account is already associated with a workspace.';
    END IF;

    -- Check if company with same name already exists (case-insensitive)
    IF EXISTS (SELECT 1 FROM public.companies WHERE LOWER(TRIM(name)) = LOWER(trimmed_name)) THEN
        RAISE EXCEPTION 'A workspace with the name "%" already exists. Please choose a different name.', trimmed_name;
    END IF;

    -- Create the company
    INSERT INTO public.companies (name)
    VALUES (trimmed_name)
    RETURNING id INTO new_company_id;

    -- Create the Company Admin role
    INSERT INTO public.roles (company_id, name, is_system_role, description)
    VALUES (new_company_id, 'Company Admin', true, 'Full access to company settings and data')
    RETURNING id INTO admin_role_id;

    -- Create other default roles
    INSERT INTO public.roles (company_id, name, is_system_role, description)
    VALUES 
        (new_company_id, 'HR Manager', true, 'Access to HR operations and employee management'),
        (new_company_id, 'Department Manager', true, 'Access to manage assigned team'),
        (new_company_id, 'Employee', true, 'Standard employee access');

    -- Create the company member association for the creator
    INSERT INTO public.company_members (company_id, user_id, role_id)
    VALUES (new_company_id, auth.uid(), admin_role_id);

    -- Initialize default company settings
    INSERT INTO public.company_settings (company_id)
    VALUES (new_company_id);

    RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
