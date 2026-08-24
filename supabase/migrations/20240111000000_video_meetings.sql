-- Migration: Video Meetings & Workplace Conferencing
-- Tables: meetings, meeting_participants, meeting_messages, meeting_audit_logs

CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    meeting_code VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(50) NOT NULL DEFAULT 'general', -- 'general', 'hr', 'interview', 'performance_review', 'team', 'training', 'management'
    host_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'waiting', 'active', 'ended', 'cancelled'
    is_locked BOOLEAN DEFAULT false,
    waiting_room_enabled BOOLEAN DEFAULT false,
    recording_enabled BOOLEAN DEFAULT true,
    recording_url TEXT,
    agenda TEXT,
    interview_details JSONB DEFAULT '{}'::jsonb, -- { candidate_name, position, stage, rating, recommendation, feedback }
    review_details JSONB DEFAULT '{}'::jsonb, -- { goals, score, strengths, improvements, action_plan }
    notes TEXT DEFAULT '',
    transcript JSONB DEFAULT '[]'::jsonb,
    ai_summary JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{"allow_chat": true, "allow_screen_share": true, "allow_reactions": true, "mute_on_join": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index for meeting_code per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_company_code ON public.meetings(company_id, meeting_code);
CREATE INDEX IF NOT EXISTS idx_meetings_company_status ON public.meetings(company_id, status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_start ON public.meetings(company_id, scheduled_start);

-- 2. Meeting Participants & Attendance
CREATE TABLE IF NOT EXISTS public.meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'participant', -- 'host', 'cohost', 'participant', 'candidate'
    status VARCHAR(30) NOT NULL DEFAULT 'invited', -- 'invited', 'waiting', 'admitted', 'rejected', 'left'
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    attendance_status VARCHAR(30) DEFAULT 'absent', -- 'present', 'absent', 'late'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_emp ON public.meeting_participants(employee_id);

-- 3. Meeting Chat Messages
CREATE TABLE IF NOT EXISTS public.meeting_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_private BOOLEAN DEFAULT false,
    recipient_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_messages_meeting ON public.meeting_messages(meeting_id, created_at);

-- 4. Meeting Audit Logs
CREATE TABLE IF NOT EXISTS public.meeting_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_audit_meeting ON public.meeting_audit_logs(meeting_id);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_audit_logs ENABLE ROW LEVEL SECURITY;

-- Permissive authenticated RLS for workspace tenants
CREATE POLICY "Allow all access to meetings for company members" ON public.meetings
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all access to meeting_participants for company members" ON public.meeting_participants
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all access to meeting_messages for company members" ON public.meeting_messages
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all access to meeting_audit_logs for company members" ON public.meeting_audit_logs
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
