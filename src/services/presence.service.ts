import { supabase } from '../lib/supabase/client';

export type UserPresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserPresence {
  employee_id: string;
  company_id: string;
  status: UserPresenceStatus;
  last_seen_at: string;
}

export const presenceService = {
  // Update presence in database
  async setPresence(companyId: string, employeeId: string, status: UserPresenceStatus): Promise<void> {
    try {
      await supabase
        .from('user_presence')
        .upsert(
          {
            company_id: companyId,
            employee_id: employeeId,
            status,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'employee_id' }
        );
    } catch (err) {
      console.warn('Presence upsert error:', err);
    }
  },

  // Fetch presence map for company employees
  async getCompanyPresence(companyId: string): Promise<Record<string, UserPresence>> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('company_id', companyId);

      if (error || !data) return {};

      const map: Record<string, UserPresence> = {};
      data.forEach((p: any) => {
        map[p.employee_id] = p;
      });
      return map;
    } catch (e) {
      return {};
    }
  },

  // Broadcast typing indicator
  broadcastTyping(conversationId: string, employeeId: string, employeeName: string, isTyping: boolean) {
    try {
      const channel = supabase.channel(`typing_${conversationId}`, {
        config: { broadcast: { self: false } },
      });
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { employeeId, employeeName, isTyping, timestamp: Date.now() },
          });
        }
      });
    } catch (e) {
      console.warn('Typing broadcast error', e);
    }
  },

  // Listen for typing indicator
  subscribeToTyping(
    conversationId: string,
    callback: (payload: { employeeId: string; employeeName: string; isTyping: boolean }) => void
  ) {
    const channelId = `typing_${conversationId}`;
    const channel = supabase
      .channel(channelId, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, (event: any) => {
        callback(event.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Realtime Presence Channel
  subscribeToPresence(
    companyId: string,
    currentEmployeeId: string,
    onPresenceChange: (presenceMap: Record<string, UserPresenceStatus>) => void
  ) {
    const channel = supabase.channel(`presence_company_${companyId}`, {
      config: {
        presence: {
          key: currentEmployeeId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const map: Record<string, UserPresenceStatus> = {};
        Object.keys(state).forEach((empId) => {
          map[empId] = 'online';
        });
        onPresenceChange(map);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        onPresenceChange({ [key]: 'online' });
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        onPresenceChange({ [key]: 'offline' });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
