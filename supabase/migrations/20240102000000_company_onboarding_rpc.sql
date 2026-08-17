CREATE OR REPLACE FUNCTION public.create_company_with_admin(new_company_name VARCHAR)
RETURNS UUID AS $$
DECLARE
    new_company_id UUID;
    admin_role_id UUID;
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Create the company
    INSERT INTO public.companies (name)
    VALUES (new_company_name)
    RETURNING id INTO new_company_id;

    -- 2. Create the Company Admin role
    INSERT INTO public.roles (company_id, name, is_system_role, description)
    VALUES (new_company_id, 'Company Admin', true, 'Full access to company settings and data')
    RETURNING id INTO admin_role_id;

    -- 3. Create other default roles
    INSERT INTO public.roles (company_id, name, is_system_role, description)
    VALUES 
        (new_company_id, 'HR Manager', true, 'Access to HR operations and employee management'),
        (new_company_id, 'Department Manager', true, 'Access to manage assigned team'),
        (new_company_id, 'Employee', true, 'Standard employee access');

    -- 4. Create the company member association for the creator
    INSERT INTO public.company_members (company_id, user_id, role_id)
    VALUES (new_company_id, auth.uid(), admin_role_id);

    -- 5. Initialize default company settings
    INSERT INTO public.company_settings (company_id)
    VALUES (new_company_id);

    RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
