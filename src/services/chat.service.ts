import { supabase } from '../lib/supabase/client';

export type ConversationType = 'direct' | 'group' | 'announcement';

export interface ChatAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface ChatReaction {
  id: string;
  message_id: string;
  employee_id: string;
  emoji: string;
  employee?: {
    first_name: string;
    last_name?: string;
  };
}

export interface ChatMessage {
  id: string;
  company_id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  parent_message_id?: string | null;
  parent_message?: {
    id: string;
    sender_id: string;
    message_text: string;
    sender?: {
      first_name: string;
      last_name?: string;
    };
  } | null;
  attachments: ChatAttachment[];
  mentions: string[];
  is_edited: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name?: string;
    employee_id?: string;
    department?: { name: string };
    designation?: { title: string };
  };
  reactions?: ChatReaction[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  employee_id: string;
  role: 'admin' | 'moderator' | 'member';
  is_pinned: boolean;
  last_read_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    hire_date?: string;
    department?: { name: string };
    designation?: { title: string };
    manager?: { first_name: string; last_name?: string };
  };
}

export interface Conversation {
  id: string;
  company_id: string;
  type: ConversationType;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by?: string | null;
  is_pinned?: boolean;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  members?: ConversationMember[];
  unread_count?: number;
  other_member?: ConversationMember['employee']; // For direct 1-to-1 chats
}

export const chatService = {
  // 1. Fetch conversations for an employee
  async getConversations(companyId: string, currentEmployeeId: string): Promise<Conversation[]> {
    try {
      // Find all conversations where current employee is a member
      const { data: memberRows, error: memErr } = await supabase
        .from('conversation_members')
        .select('conversation_id, is_pinned, last_read_at')
        .eq('company_id', companyId)
        .eq('employee_id', currentEmployeeId);

      if (memErr) throw memErr;
      if (!memberRows || memberRows.length === 0) return [];

      const convIds = memberRows.map((m: any) => m.conversation_id);
      const memberMetaMap = new Map(memberRows.map((m: any) => [m.conversation_id, m]));

      // Fetch conversations with all members and details
      const { data: convs, error: convErr } = await supabase
        .from('conversations')
        .select(`
          *,
          members:conversation_members(
            id, conversation_id, employee_id, role, is_pinned, last_read_at,
            employee:employees(id, first_name, last_name, email, phone, hire_date, department:departments(name), designation:designations(title))
          )
        `)
        .in('id', convIds)
        .order('last_message_at', { ascending: false });

      if (convErr || !convs) return [];

      // Calculate unread counts and set other member for direct chats
      return convs.map((conv: any) => {
        const myMeta = memberMetaMap.get(conv.id);
        const other = conv.type === 'direct'
          ? (conv.members || []).find((m: any) => m.employee_id !== currentEmployeeId)?.employee
          : undefined;

        return {
          ...conv,
          is_pinned: myMeta?.is_pinned || false,
          other_member: other,
          unread_count: 0, // Computed or live updated
        } as Conversation;
      });
    } catch (e) {
      console.error('Error fetching conversations', e);
      return [];
    }
  },

  // 2. Get or Create 1-on-1 Direct Conversation
  async getOrCreateDirectConversation(companyId: string, currentEmpId: string, targetEmpId: string): Promise<Conversation> {
    // Check if direct conversation already exists between both employees
    const { data: myMemberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('company_id', companyId)
      .eq('employee_id', currentEmpId);

    if (myMemberships && myMemberships.length > 0) {
      const myConvIds = myMemberships.map((m: any) => m.conversation_id);
      const { data: sharedMemberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .in('conversation_id', myConvIds)
        .eq('employee_id', targetEmpId);

      if (sharedMemberships && sharedMemberships.length > 0) {
        for (const shared of sharedMemberships) {
          const { data: conv } = await supabase
            .from('conversations')
            .select(`
              *,
              members:conversation_members(
                id, conversation_id, employee_id, role, is_pinned, last_read_at,
                employee:employees(id, first_name, last_name, email, phone, hire_date, department:departments(name), designation:designations(title))
              )
            `)
            .eq('id', shared.conversation_id)
            .eq('type', 'direct')
            .maybeSingle();

          if (conv) {
            const other = (conv.members || []).find((m: any) => m.employee_id !== currentEmpId)?.employee;
            return { ...conv, other_member: other } as Conversation;
          }
        }
      }
    }

    // Create new direct conversation
    const { data: newConv, error: createErr } = await supabase
      .from('conversations')
      .insert({
        company_id: companyId,
        type: 'direct',
        created_by: currentEmpId,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // Add both members
    await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, company_id: companyId, employee_id: currentEmpId, role: 'admin' },
      { conversation_id: newConv.id, company_id: companyId, employee_id: targetEmpId, role: 'member' },
    ]);

    // Fetch target employee details
    const { data: targetEmp } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, phone, hire_date, department:departments(name), designation:designations(title)')
      .eq('id', targetEmpId)
      .single();

    return {
      ...newConv,
      other_member: targetEmp,
      members: [],
    } as Conversation;
  },

  // 3. Create Group / Department Channel
  async createGroupConversation(
    companyId: string,
    creatorEmpId: string,
    title: string,
    description: string,
    memberEmpIds: string[],
    avatarUrl?: string
  ): Promise<Conversation> {
    const { data: newConv, error: createErr } = await supabase
      .from('conversations')
      .insert({
        company_id: companyId,
        type: 'group',
        title,
        description,
        avatar_url: avatarUrl || null,
        created_by: creatorEmpId,
        last_message_at: new Date().toISOString(),
        last_message_preview: `Group created by ${creatorEmpId}`,
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // Add all members including creator
    const allMemberIds = Array.from(new Set([creatorEmpId, ...memberEmpIds]));
    const memberRows = allMemberIds.map((empId) => ({
      conversation_id: newConv.id,
      company_id: companyId,
      employee_id: empId,
      role: empId === creatorEmpId ? 'admin' : 'member',
    }));

    await supabase.from('conversation_members').insert(memberRows);

    return newConv as Conversation;
  },

  // 4. Fetch Messages with Pagination and Thread Details
  async getMessages(conversationId: string, limit = 50, beforeTimestamp?: string): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:employees(id, first_name, last_name, employee_id, department:departments(name), designation:designations(title)),
          parent_message:chat_messages!parent_message_id(
            id, sender_id, message_text,
            sender:employees(first_name, last_name)
          ),
          reactions:message_reactions(
            id, message_id, employee_id, emoji,
            employee:employees(first_name, last_name)
          )
        `)
        .eq('conversation_id', conversationId);

      if (beforeTimestamp) {
        query = query.lt('created_at', beforeTimestamp);
      }

      const { data, error } = await query
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        // Fallback without deep joins
        const { data: raw, error: rawErr } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(limit);

        if (rawErr || !raw) return [];
        return raw as ChatMessage[];
      }

      return (data || []) as ChatMessage[];
    } catch (e) {
      console.error('Error fetching chat messages', e);
      return [];
    }
  },

  // 5. Send Message
  async sendMessage(payload: {
    company_id: string;
    conversation_id: string;
    sender_id: string;
    message_text: string;
    parent_message_id?: string | null;
    attachments?: ChatAttachment[];
    mentions?: string[];
  }): Promise<ChatMessage> {
    const record = {
      company_id: payload.company_id,
      conversation_id: payload.conversation_id,
      sender_id: payload.sender_id,
      message_text: payload.message_text,
      parent_message_id: payload.parent_message_id || null,
      attachments: payload.attachments || [],
      mentions: payload.mentions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(record)
      .select(`
        *,
        sender:employees(id, first_name, last_name, employee_id, department:departments(name), designation:designations(title)),
        parent_message:chat_messages!parent_message_id(
          id, sender_id, message_text,
          sender:employees(first_name, last_name)
        )
      `)
      .single();

    if (error) throw error;

    // Update conversation last_message_at and preview
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: payload.message_text.length > 60 ? payload.message_text.substring(0, 57) + '...' : payload.message_text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.conversation_id);

    // Instant Realtime Broadcast to the conversation room
    this.broadcastMessage(payload.conversation_id, data);

    // Trigger Notification to members or mentions
    this.dispatchMessageNotifications(payload.company_id, payload.conversation_id, payload.sender_id, payload.message_text, payload.mentions);

    return data as ChatMessage;
  },

  // 6. Edit Message
  async editMessage(messageId: string, conversationId: string, newText: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        message_text: newText,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
    this.broadcastMessage(conversationId, { id: messageId, type: 'edit', message_text: newText });
  },

  // 7. Delete Message
  async deleteMessage(messageId: string, conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        message_text: 'This message was deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
    this.broadcastMessage(conversationId, { id: messageId, type: 'delete' });
  },

  // 8. Toggle Emoji Reaction
  async toggleReaction(messageId: string, conversationId: string, employeeId: string, emoji: string): Promise<void> {
    // Check if reaction already exists
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('employee_id', employeeId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        employee_id: employeeId,
        emoji,
      });
    }

    this.broadcastMessage(conversationId, { id: messageId, type: 'reaction_update' });
  },

  // 9. Pin / Unpin Message
  async pinMessage(messageId: string, conversationId: string, isPinned: boolean): Promise<void> {
    await supabase
      .from('chat_messages')
      .update({ is_pinned: isPinned })
      .eq('id', messageId);

    this.broadcastMessage(conversationId, { id: messageId, type: 'pin_update' });
  },

  // 10. Pin / Unpin Conversation in Sidebar
  async pinConversation(conversationId: string, employeeId: string, isPinned: boolean): Promise<void> {
    await supabase
      .from('conversation_members')
      .update({ is_pinned: isPinned })
      .eq('conversation_id', conversationId)
      .eq('employee_id', employeeId);
  },

  // 11. Mark Conversation As Read
  async markConversationAsRead(conversationId: string, employeeId: string): Promise<void> {
    try {
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('employee_id', employeeId);
    } catch (e) {}
  },

  // 12. Search Messages Across Chats
  async searchMessages(companyId: string, _currentEmployeeId?: string, queryText = ''): Promise<ChatMessage[]> {
    if (!queryText || queryText.trim().length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:employees(id, first_name, last_name),
          conversation:conversations(id, type, title)
        `)
        .eq('company_id', companyId)
        .ilike('message_text', `%${queryText.trim()}%`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error || !data) return [];
      return data as ChatMessage[];
    } catch (e) {
      return [];
    }
  },

  // 13. Upload Attachment to 'workreport' bucket with Base64 fallback
  async uploadChatAttachment(companyId: string, file: File): Promise<ChatAttachment> {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `chat_${companyId}/${Date.now()}_${cleanFileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('workreport')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('workreport').getPublicUrl(path);
        if (publicUrlData?.publicUrl) {
          return {
            name: file.name,
            url: publicUrlData.publicUrl,
            size: file.size,
            type: file.type,
          };
        }
      }
    } catch (e) {
      console.warn('Storage upload error, using Data URL fallback', e);
    }

    // Fallback: Read as Base64 Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          url: reader.result as string,
          size: file.size,
          type: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Broadcast Message to Conversation Room
  broadcastMessage(conversationId: string, payload: any) {
    try {
      const channel = supabase.channel(`chat_${conversationId}`, {
        config: { broadcast: { self: false } },
      });
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'new_chat_event',
            payload,
          });
        }
      });
    } catch (e) {}
  },

  // Listen for Live Conversation Updates
  subscribeToConversation(conversationId: string, callback: (event: any) => void) {
    const channelId = `chat_${conversationId}`;
    const channel = supabase
      .channel(channelId, {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'new_chat_event' }, (event: any) => {
        callback(event.payload);
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          callback(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          callback({ type: 'reaction_update' });
        }
      )
      .subscribe();

    // 2-second heartbeat sync while active in room
    const interval = setInterval(() => {
      callback({ type: 'heartbeat_poll' });
    }, 2000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  },

  // Listen for Sidebar Updates (New messages across all conversations)
  subscribeToAllChats(companyId: string, callback: () => void) {
    const channelId = `chats_company_${companyId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `company_id=eq.${companyId}`,
        },
        () => callback()
      )
      .subscribe();

    const interval = setInterval(callback, 4000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  },

  // Helper to dispatch in-app notifications on message
  async dispatchMessageNotifications(
    companyId: string,
    conversationId: string,
    senderId: string,
    text: string,
    mentions?: string[]
  ) {
    try {
      const { notificationService } = await import('./notification.service');
      const { data: members } = await supabase
        .from('conversation_members')
        .select('employee_id, employee:employees(user_id, profile_id, first_name, last_name)')
        .eq('conversation_id', conversationId);

      const { data: senderEmp } = await supabase
        .from('employees')
        .select('first_name, last_name')
        .eq('id', senderId)
        .maybeSingle();

      const senderName = `${senderEmp?.first_name || 'Team member'} ${senderEmp?.last_name || ''}`.trim();

      if (members) {
        for (const m of members) {
          if (m.employee_id !== senderId) {
            const uId = (m as any).employee?.user_id || (m as any).employee?.profile_id;
            if (uId) {
              const isMentioned = mentions && mentions.includes(m.employee_id);
              notificationService.createNotification({
                company_id: companyId,
                user_id: uId,
                title: isMentioned ? `💬 @Mention from ${senderName}` : `💬 New message from ${senderName}`,
                message: text.length > 70 ? text.substring(0, 67) + '...' : text,
                type: 'chat_message',
                reference_id: conversationId,
              }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {}
  },
};
