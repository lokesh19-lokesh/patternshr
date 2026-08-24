-- Migration for Workspace Deletion with OTP Verification

CREATE TABLE IF NOT EXISTS public.workspace_deletion_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workspace_deletion_otps ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own deletion OTPs
CREATE POLICY "Users can access own deletion otps" ON public.workspace_deletion_otps
    FOR ALL USING (auth.uid() = user_id);

-- RPC to generate and store deletion OTP
CREATE OR REPLACE FUNCTION public.generate_workspace_deletion_otp(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_email VARCHAR;
    v_is_admin BOOLEAN;
    v_otp VARCHAR(6);
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify user is Company Admin for this company
    SELECT EXISTS (
        SELECT 1 FROM public.company_members cm
        JOIN public.roles r ON cm.role_id = r.id
        WHERE cm.company_id = p_company_id
        AND cm.user_id = v_user_id
        AND (r.name ILIKE '%admin%' OR r.name ILIKE '%owner%')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only Company Admins can request workspace deletion.';
    END IF;

    -- Get user email
    SELECT email INTO v_email FROM public.profiles WHERE id = v_user_id;

    -- Generate random 6-digit OTP
    v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    v_expires_at := NOW() + INTERVAL '10 minutes';

    -- Remove old OTPs for this company and user
    DELETE FROM public.workspace_deletion_otps
    WHERE company_id = p_company_id AND user_id = v_user_id;

    -- Insert new OTP
    INSERT INTO public.workspace_deletion_otps (company_id, user_id, email, otp_code, expires_at)
    VALUES (p_company_id, v_user_id, v_email, v_otp, v_expires_at);

    RETURN jsonb_build_object(
        'success', true,
        'email', v_email,
        'otp', v_otp,
        'expires_at', v_expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to verify OTP and delete workspace
CREATE OR REPLACE FUNCTION public.verify_and_delete_workspace(
    p_company_id UUID,
    p_otp_code VARCHAR,
    p_company_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_is_admin BOOLEAN;
    v_actual_name VARCHAR;
    v_otp_valid BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Check Admin status
    SELECT EXISTS (
        SELECT 1 FROM public.company_members cm
        JOIN public.roles r ON cm.role_id = r.id
        WHERE cm.company_id = p_company_id
        AND cm.user_id = v_user_id
        AND (r.name ILIKE '%admin%' OR r.name ILIKE '%owner%')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Permission denied. Only Company Admins can delete a workspace.';
    END IF;

    -- 2. Verify company name confirmation (case-insensitive)
    SELECT name INTO v_actual_name FROM public.companies WHERE id = p_company_id;
    IF v_actual_name IS NULL THEN
        RAISE EXCEPTION 'Workspace not found.';
    END IF;

    IF LOWER(TRIM(v_actual_name)) != LOWER(TRIM(p_company_name)) THEN
        RAISE EXCEPTION 'Company name confirmation does not match "%".', v_actual_name;
    END IF;

    -- 3. Verify OTP
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_deletion_otps
        WHERE company_id = p_company_id
        AND user_id = v_user_id
        AND otp_code = TRIM(p_otp_code)
        AND expires_at > NOW()
    ) INTO v_otp_valid;

    IF NOT v_otp_valid THEN
        RAISE EXCEPTION 'Invalid or expired OTP verification code. Please request a new code.';
    END IF;

    -- 4. Delete the company (All cascading tables will be deleted automatically)
    DELETE FROM public.companies WHERE id = p_company_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
