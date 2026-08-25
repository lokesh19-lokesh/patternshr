import { supabase } from '../lib/supabase/client';
import type { Employee } from './employee.service';

export type MeetingType = 
  | 'general'
  | 'hr'
  | 'interview'
  | 'performance_review'
  | 'team'
  | 'training'
  | 'management';

export type MeetingStatus = 'scheduled' | 'waiting' | 'active' | 'ended' | 'cancelled';
export type ParticipantRole = 'host' | 'cohost' | 'participant' | 'candidate';
export type ParticipantStatus = 'invited' | 'waiting' | 'admitted' | 'rejected' | 'left';

export interface MeetingInterviewDetails {
  candidate_name?: string;
  position?: string;
  stage?: string;
  rating?: number; // 1 to 5
  recommendation?: 'Selected' | 'Rejected' | 'Hold' | 'Next Round';
  feedback?: string;
}

export interface MeetingReviewDetails {
  goals?: string;
  score?: number; // 1 to 10
  strengths?: string;
  improvements?: string;
  action_plan?: string;
}

export interface MeetingAISummary {
  topics?: string[];
  decisions?: string[];
  action_items?: { task: string; assignee?: string }[];
  follow_ups?: string[];
}

export interface MeetingTranscriptItem {
  speaker: string;
  time: string;
  text: string;
}

export interface MeetingSettings {
  allow_chat: boolean;
  allow_screen_share: boolean;
  allow_reactions: boolean;
  mute_on_join: boolean;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  company_id: string;
  employee_id: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joined_at?: string;
  left_at?: string;
  duration_minutes?: number;
  attendance_status?: 'present' | 'absent' | 'late';
  employee?: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    department?: { name: string };
    designation?: { name?: string; title?: string };
  };
}

export interface MeetingMessage {
  id: string;
  meeting_id: string;
  company_id: string;
  sender_id: string;
  message_text: string;
  attachments?: { name: string; url: string; size?: number; type?: string }[];
  is_private?: boolean;
  recipient_id?: string;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name?: string;
  };
}

export interface Meeting {
  id: string;
  company_id: string;
  meeting_code: string;
  title: string;
  description?: string;
  meeting_type: MeetingType;
  host_employee_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  duration_minutes?: number;
  status: MeetingStatus;
  is_locked: boolean;
  waiting_room_enabled: boolean;
  recording_enabled: boolean;
  recording_url?: string;
  agenda?: string;
  interview_details?: MeetingInterviewDetails;
  review_details?: MeetingReviewDetails;
  notes?: string;
  transcript?: MeetingTranscriptItem[];
  ai_summary?: MeetingAISummary;
  settings?: MeetingSettings;
  created_at: string;
  updated_at: string;
  host?: Employee;
  participants?: MeetingParticipant[];
}

export const meetingService = {
  // Generate random human-friendly meeting code like: tpc-abc-xyz
  generateMeetingCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randPart1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const randPart2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `tpc-${randPart1}-${randPart2}`;
  },

  // 1. Get Upcoming Meetings
  async getUpcomingMeetings(companyId: string): Promise<Meeting[]> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          host:employees!meetings_host_employee_id_fkey(
            id, first_name, last_name, email,
            department:departments!employees_department_id_fkey(name),
            designation:designations(name)
          ),
          participants:meeting_participants(
            id, meeting_id, employee_id, role, status,
            employee:employees(id, first_name, last_name, email, department:departments!employees_department_id_fkey(name), designation:designations(name))
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['scheduled', 'waiting', 'active'])
        .order('scheduled_start', { ascending: true });

      if (error) {
        // Fallback plain query without joins
        const { data: rawData } = await supabase
          .from('meetings')
          .select('*')
          .eq('company_id', companyId)
          .in('status', ['scheduled', 'waiting', 'active'])
          .order('scheduled_start', { ascending: true });

        return (rawData || []) as Meeting[];
      }

      return (data || []) as Meeting[];
    } catch (e) {
      console.error('Error fetching upcoming meetings', e);
      return [];
    }
  },

  // 2. Get Recent / Completed Meetings (History)
  async getRecentMeetings(companyId: string): Promise<Meeting[]> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          host:employees!meetings_host_employee_id_fkey(
            id, first_name, last_name, email,
            department:departments!employees_department_id_fkey(name),
            designation:designations(name)
          ),
          participants:meeting_participants(
            id, meeting_id, employee_id, role, status, joined_at, left_at, duration_minutes, attendance_status,
            employee:employees(id, first_name, last_name, email, department:departments!employees_department_id_fkey(name), designation:designations(name))
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['ended', 'cancelled'])
        .order('actual_end', { ascending: false })
        .limit(30);

      if (error) {
        const { data: rawData } = await supabase
          .from('meetings')
          .select('*')
          .eq('company_id', companyId)
          .in('status', ['ended', 'cancelled'])
          .order('created_at', { ascending: false })
          .limit(30);

        return (rawData || []) as Meeting[];
      }

      return (data || []) as Meeting[];
    } catch (e) {
      console.error('Error fetching recent meetings', e);
      return [];
    }
  },

  // 3. Get Meeting Details by Code or ID
  async getMeetingByCode(companyId: string, meetingCode: string): Promise<Meeting | null> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          host:employees!meetings_host_employee_id_fkey(
            id, first_name, last_name, email,
            department:departments!employees_department_id_fkey(name),
            designation:designations(name)
          ),
          participants:meeting_participants(
            id, meeting_id, employee_id, role, status, joined_at, left_at, duration_minutes, attendance_status,
            employee:employees(id, first_name, last_name, email, department:departments!employees_department_id_fkey(name), designation:designations(name))
          )
        `)
        .eq('company_id', companyId)
        .eq('meeting_code', meetingCode.trim())
        .maybeSingle();

      if (error || !data) {
        // Fallback plain query
        const { data: rawData } = await supabase
          .from('meetings')
          .select('*')
          .eq('company_id', companyId)
          .eq('meeting_code', meetingCode.trim())
          .maybeSingle();

        return (rawData || null) as Meeting | null;
      }

      return data as Meeting;
    } catch (e) {
      console.error('Error fetching meeting by code', e);
      return null;
    }
  },

  // 4. Create Instant Meeting
  async createInstantMeeting(
    companyId: string,
    hostEmployeeId: string,
    title: string = 'Instant Meeting',
    meetingType: MeetingType = 'general'
  ): Promise<Meeting> {
    const meetingCode = this.generateMeetingCode();
    const now = new Date().toISOString();

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        company_id: companyId,
        meeting_code: meetingCode,
        title,
        meeting_type: meetingType,
        host_employee_id: hostEmployeeId,
        scheduled_start: now,
        actual_start: now,
        status: 'active',
        waiting_room_enabled: false,
        recording_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Add host as participant
    await supabase.from('meeting_participants').insert({
      meeting_id: meeting.id,
      company_id: companyId,
      employee_id: hostEmployeeId,
      role: 'host',
      status: 'admitted',
      joined_at: now,
      attendance_status: 'present',
    });

    // Log audit
    await this.logAudit(companyId, meeting.id, hostEmployeeId, 'created_instant', { title, code: meetingCode });

    return meeting as Meeting;
  },

  // 5. Schedule a Meeting
  async scheduleMeeting(
    companyId: string,
    hostEmployeeId: string,
    payload: {
      title: string;
      description?: string;
      meeting_type: MeetingType;
      scheduled_start: string;
      scheduled_end?: string;
      duration_minutes?: number;
      agenda?: string;
      participant_ids: string[];
      waiting_room_enabled?: boolean;
      recording_enabled?: boolean;
      interview_details?: MeetingInterviewDetails;
      review_details?: MeetingReviewDetails;
    }
  ): Promise<Meeting> {
    const meetingCode = this.generateMeetingCode();

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        company_id: companyId,
        meeting_code: meetingCode,
        title: payload.title,
        description: payload.description || '',
        meeting_type: payload.meeting_type,
        host_employee_id: hostEmployeeId,
        scheduled_start: payload.scheduled_start,
        scheduled_end: payload.scheduled_end,
        duration_minutes: payload.duration_minutes || 30,
        agenda: payload.agenda || '',
        status: 'scheduled',
        waiting_room_enabled: payload.waiting_room_enabled ?? false,
        recording_enabled: payload.recording_enabled ?? true,
        interview_details: payload.interview_details || {},
        review_details: payload.review_details || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Add host as participant
    const participantsToInsert = [
      {
        meeting_id: meeting.id,
        company_id: companyId,
        employee_id: hostEmployeeId,
        role: 'host',
        status: 'invited',
      },
      ...payload.participant_ids
        .filter((id) => id !== hostEmployeeId)
        .map((id) => ({
          meeting_id: meeting.id,
          company_id: companyId,
          employee_id: id,
          role: payload.meeting_type === 'interview' ? 'candidate' : 'participant',
          status: 'invited',
        })),
    ];

    if (participantsToInsert.length > 0) {
      await supabase.from('meeting_participants').insert(participantsToInsert);
    }

    // Log audit
    await this.logAudit(companyId, meeting.id, hostEmployeeId, 'scheduled_meeting', {
      title: payload.title,
      scheduled_start: payload.scheduled_start,
      participants_count: payload.participant_ids.length,
    });

    return meeting as Meeting;
  },

  // 6. Update Meeting Status (e.g. Start, End, Cancel)
  async updateMeetingStatus(
    companyId: string,
    meetingId: string,
    status: MeetingStatus,
    actorId?: string
  ): Promise<void> {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'active') {
      updates.actual_start = new Date().toISOString();
    } else if (status === 'ended') {
      updates.actual_end = new Date().toISOString();
    }

    const { error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('company_id', companyId)
      .eq('id', meetingId);

    if (error) throw error;

    if (actorId) {
      await this.logAudit(companyId, meetingId, actorId, `meeting_${status}`, { status });
    }
  },

  // 7. Update Meeting Notes
  async saveMeetingNotes(companyId: string, meetingId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('meetings')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', meetingId);

    if (error) throw error;
  },

  // 8. Update AI Summary
  async saveMeetingSummary(companyId: string, meetingId: string, summary: MeetingAISummary): Promise<void> {
    const { error } = await supabase
      .from('meetings')
      .update({ ai_summary: summary, updated_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', meetingId);

    if (error) throw error;
  },

  // 9. Update Transcripts
  async saveMeetingTranscript(companyId: string, meetingId: string, transcript: MeetingTranscriptItem[]): Promise<void> {
    const { error } = await supabase
      .from('meetings')
      .update({ transcript, updated_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', meetingId);

    if (error) throw error;
  },

  // 10. Update HR Interview Details
  async updateInterviewDetails(companyId: string, meetingId: string, details: Partial<MeetingInterviewDetails>): Promise<void> {
    const { data: current } = await supabase
      .from('meetings')
      .select('interview_details')
      .eq('id', meetingId)
      .single();

    const merged = { ...(current?.interview_details || {}), ...details };
    const { error } = await supabase
      .from('meetings')
      .update({ interview_details: merged, updated_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', meetingId);

    if (error) throw error;
  },

  // 11. Update Performance Review Details
  async updatePerformanceReview(companyId: string, meetingId: string, details: Partial<MeetingReviewDetails>): Promise<void> {
    const { data: current } = await supabase
      .from('meetings')
      .select('review_details')
      .eq('id', meetingId)
      .single();

    const merged = { ...(current?.review_details || {}), ...details };
    const { error } = await supabase
      .from('meetings')
      .update({ review_details: merged, updated_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', meetingId);

    if (error) throw error;
  },

  // 12. Upload Meeting Recording
  async uploadMeetingRecording(companyId: string, meetingId: string, blob: Blob): Promise<string> {
    const fileName = `meeting-recordings/${companyId}/${meetingId}_${Date.now()}.webm`;
    const { error } = await supabase.storage
      .from('workreport')
      .upload(fileName, blob, { contentType: 'video/webm', upsert: true });

    if (error) throw error;

    const { data: pubData } = supabase.storage.from('workreport').getPublicUrl(fileName);
    const publicUrl = pubData.publicUrl;

    await supabase
      .from('meetings')
      .update({ recording_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', meetingId);

    return publicUrl;
  },

  // 13. In-Meeting Chat Messages
  async getMeetingMessages(meetingId: string): Promise<MeetingMessage[]> {
    try {
      const { data, error } = await supabase
        .from('meeting_messages')
        .select(`
          *,
          sender:employees(id, first_name, last_name)
        `)
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data as MeetingMessage[];
    } catch (e) {
      console.error('Error fetching meeting messages', e);
      return [];
    }
  },

  async sendMeetingMessage(
    companyId: string,
    meetingId: string,
    senderId: string,
    text: string,
    attachments: any[] = [],
    isPrivate: boolean = false,
    recipientId?: string
  ): Promise<MeetingMessage> {
    const { data, error } = await supabase
      .from('meeting_messages')
      .insert({
        company_id: companyId,
        meeting_id: meetingId,
        sender_id: senderId,
        message_text: text,
        attachments,
        is_private: isPrivate,
        recipient_id: recipientId || null,
      })
      .select(`
        *,
        sender:employees(id, first_name, last_name)
      `)
      .single();

    if (error) throw error;
    return data as MeetingMessage;
  },

  // 14. Record Participant Attendance
  async recordParticipantJoin(meetingId: string, companyId: string, employeeId: string, role: ParticipantRole = 'participant'): Promise<void> {
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from('meeting_participants')
      .select('id')
      .eq('meeting_id', meetingId)
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('meeting_participants')
        .update({
          status: 'admitted',
          joined_at: now,
          attendance_status: 'present',
          updated_at: now,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('meeting_participants').insert({
        meeting_id: meetingId,
        company_id: companyId,
        employee_id: employeeId,
        role,
        status: 'admitted',
        joined_at: now,
        attendance_status: 'present',
      });
    }

    await this.logAudit(companyId, meetingId, employeeId, 'participant_joined', { employeeId });
  },

  async recordParticipantLeave(meetingId: string, companyId: string, employeeId: string): Promise<void> {
    const now = new Date().toISOString();
    const { data: participant } = await supabase
      .from('meeting_participants')
      .select('id, joined_at')
      .eq('meeting_id', meetingId)
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (participant) {
      let duration = 0;
      if (participant.joined_at) {
        const diffMs = new Date().getTime() - new Date(participant.joined_at).getTime();
        duration = Math.round(diffMs / 60000);
      }

      await supabase
        .from('meeting_participants')
        .update({
          status: 'left',
          left_at: now,
          duration_minutes: duration,
          updated_at: now,
        })
        .eq('id', participant.id);

      await this.logAudit(companyId, meetingId, employeeId, 'participant_left', { duration });
    }
  },

  // 15. Audit Logging Helper
  async logAudit(companyId: string, meetingId: string, actorId: string, action: string, details: any = {}): Promise<void> {
    try {
      await supabase.from('meeting_audit_logs').insert({
        company_id: companyId,
        meeting_id: meetingId,
        actor_id: actorId,
        action,
        details,
      });
    } catch (e) {
      console.warn('Could not write meeting audit log', e);
    }
  },

  // 16. Delete or Cancel Meeting
  async deleteMeeting(companyId: string, meetingId: string): Promise<void> {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('company_id', companyId)
      .eq('id', meetingId);

    if (error) throw error;
  },

  // 17. Toggle Meeting Room Lock
  async toggleMeetingLock(companyId: string, meetingId: string, isLocked: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ is_locked: isLocked })
        .eq('company_id', companyId)
        .eq('id', meetingId);
      return !error;
    } catch (e) {
      console.warn('Error updating meeting lock', e);
      return false;
    }
  },
};
