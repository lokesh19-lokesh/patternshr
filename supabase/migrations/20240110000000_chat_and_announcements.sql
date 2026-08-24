-- ==============================================================================
-- MIGRATION: Comprehensive Workplace Chat, Group Channels, and Presence System
-- ==============================================================================

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct', 'group', 'announcement'
    title VARCHAR(255),
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_company ON public.conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(company_id, last_message_at DESC);

-- 2. Conversation Members Table
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    is_pinned BOOLEAN DEFAULT false,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notifications_muted BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_lookup ON public.conversation_members(employee_id, company_id);

-- 3. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    parent_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    mentions JSONB DEFAULT '[]'::jsonb,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON public.chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent ON public.chat_messages(parent_message_id);

-- 4. Message Reactions Table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    emoji VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, employee_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_msg_reactions_msg ON public.message_reactions(message_id);

-- 5. User Presence & Last Seen Table
CREATE TABLE IF NOT EXISTS public.user_presence (
    employee_id UUID PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'away', 'busy', 'offline'
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_company ON public.user_presence(company_id);

-- 6. Announcement Reads Confirmation Table
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, employee_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policies
DO $$
BEGIN
    -- Conversations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Allow company conversations access') THEN
        CREATE POLICY "Allow company conversations access" ON public.conversations
            FOR ALL USING (true);
    END IF;

    -- Conversation Members
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_members' AND policyname = 'Allow company member access') THEN
        CREATE POLICY "Allow company member access" ON public.conversation_members
            FOR ALL USING (true);
    END IF;

    -- Chat Messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Allow company chat messages') THEN
        CREATE POLICY "Allow company chat messages" ON public.chat_messages
            FOR ALL USING (true);
    END IF;

    -- Message Reactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'Allow message reactions') THEN
        CREATE POLICY "Allow message reactions" ON public.message_reactions
            FOR ALL USING (true);
    END IF;

    -- Presence
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_presence' AND policyname = 'Allow user presence') THEN
        CREATE POLICY "Allow user presence" ON public.user_presence
            FOR ALL USING (true);
    END IF;

    -- Announcement Reads
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'announcement_reads' AND policyname = 'Allow announcement reads') THEN
        CREATE POLICY "Allow announcement reads" ON public.announcement_reads
            FOR ALL USING (true);
    END IF;
END $$;

-- Enable Realtime for all chat tables if publication exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.conversations,
            public.conversation_members,
            public.chat_messages,
            public.message_reactions,
            public.user_presence,
            public.announcements,
            public.announcement_reads;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
