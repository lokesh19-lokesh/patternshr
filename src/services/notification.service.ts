import { supabase } from '../lib/supabase/client';

export interface AppNotification {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // 'leave_update', 'report_update', 'system'
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  async getNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data as AppNotification[];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
  },

  async createNotification(data: Partial<AppNotification>): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({ ...data, is_read: false });
    
    if (error) throw error;

    // Simulate Email Notification (Fallback for MVP)
    console.log(`[EMAIL DISPATCH SIMULATION] To User: ${data.user_id}`);
    console.log(`Subject: ${data.title}`);
    console.log(`Body: ${data.message}`);
    console.log(`-----------------------------------------`);
  },

  // Realtime Subscription
  subscribe(userId: string, callback: (payload: any) => void) {
    const channelId = `notifications_${userId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
