import { supabase } from '../lib/supabase/client';

export interface CompanyAnnouncement {
  id: string;
  company_id: string;
  title: string;
  description: string;
  attachment_url: string | null;
  attachment_name?: string | null;
  audience: string;
  audience_details?: any;
  status: string;
  publish_date: string;
  expiry_date?: string | null;
  created_by?: string;
  created_at: string;
  priority?: 'normal' | 'important' | 'urgent';
  creator?: {
    id: string;
    first_name: string;
    last_name?: string;
  };
  is_read?: boolean;
  reads_count?: number;
}

export const announcementService = {
  // Get all published company announcements
  async getAnnouncements(companyId: string, currentEmployeeId?: string): Promise<CompanyAnnouncement[]> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, creator:employees(id, first_name, last_name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback without join
        const { data: raw, error: rawErr } = await supabase
          .from('announcements')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (rawErr || !raw) return [];
        return raw as CompanyAnnouncement[];
      }

      // Check read statuses if employee ID provided
      if (currentEmployeeId && data.length > 0) {
        const announcementIds = data.map((a: any) => a.id);
        const { data: reads } = await supabase
          .from('announcement_reads')
          .select('announcement_id')
          .in('announcement_id', announcementIds)
          .eq('employee_id', currentEmployeeId);

        const readSet = new Set((reads || []).map((r: any) => r.announcement_id));

        return data.map((a: any) => ({
          ...a,
          is_read: readSet.has(a.id),
        }));
      }

      return data as CompanyAnnouncement[];
    } catch (e) {
      console.error('Error fetching announcements', e);
      return [];
    }
  },

  // Create new announcement (HR/Admin)
  async createAnnouncement(
    companyId: string,
    creatorEmployeeId: string,
    payload: {
      title: string;
      description: string;
      attachment_url?: string | null;
      priority?: 'normal' | 'important' | 'urgent';
    }
  ): Promise<CompanyAnnouncement> {
    const record = {
      company_id: companyId,
      created_by: creatorEmployeeId,
      title: payload.title,
      description: payload.description,
      attachment_url: payload.attachment_url || null,
      status: 'published',
      publish_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert(record)
      .select('*, creator:employees(id, first_name, last_name)')
      .single();

    if (error) throw error;

    // Trigger Notification to Company Members
    try {
      const { notificationService } = await import('./notification.service');
      const { data: employees } = await supabase
        .from('employees')
        .select('user_id, profile_id')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (employees) {
        for (const emp of employees) {
          const uId = emp.user_id || emp.profile_id;
          if (uId) {
            notificationService.createNotification({
              company_id: companyId,
              user_id: uId,
              title: `📢 Company Announcement: ${payload.title}`,
              message: payload.description.length > 80 ? payload.description.substring(0, 77) + '...' : payload.description,
              type: 'announcement',
              reference_id: data.id,
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn('Failed to broadcast announcement notification', e);
    }

    return data as CompanyAnnouncement;
  },

  // Mark announcement as confirmed/read
  async markAsRead(announcementId: string, employeeId: string): Promise<void> {
    try {
      await supabase
        .from('announcement_reads')
        .upsert(
          {
            announcement_id: announcementId,
            employee_id: employeeId,
            read_at: new Date().toISOString(),
          },
          { onConflict: 'announcement_id,employee_id' }
        );
    } catch (e) {
      console.warn('Error marking announcement as read', e);
    }
  },

  // Get list of employees who acknowledged/read the announcement
  async getReadReceipts(announcementId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('announcement_reads')
        .select('*, employee:employees(id, first_name, last_name, email, department:departments(name), designation:designations(name))')
        .eq('announcement_id', announcementId)
        .order('read_at', { ascending: false });

      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  },

  // Realtime subscription for announcements
  subscribeToAnnouncements(companyId: string, callback: () => void) {
    const channelId = `announcements_company_${companyId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          callback();
        }
      )
      .subscribe();

    const interval = setInterval(callback, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  },
};
