-- Migration to automatically link and cascade delete auth.users when a workspace is deleted

-- 1. Function and Trigger to cascade delete auth.users when a company is deleted
CREATE OR REPLACE FUNCTION public.handle_company_deletion_cleanup()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
BEGIN
    -- Delete all member accounts from auth.users
    FOR r IN (SELECT user_id FROM public.company_members WHERE company_id = OLD.id) LOOP
        DELETE FROM auth.users WHERE id = r.user_id;
    END LOOP;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_company_users ON public.companies;
CREATE TRIGGER trg_cleanup_company_users
    BEFORE DELETE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_company_deletion_cleanup();

-- 2. Explicit RPC to delete workspace and user logins
CREATE OR REPLACE FUNCTION public.delete_workspace_and_all_users(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    r RECORD;
BEGIN
    -- Delete all auth.users for this company
    FOR r IN (SELECT user_id FROM public.company_members WHERE company_id = p_company_id) LOOP
        DELETE FROM auth.users WHERE id = r.user_id;
    END LOOP;

    -- Delete the company (cascades all tenant tables)
    DELETE FROM public.companies WHERE id = p_company_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
