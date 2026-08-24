import { supabase } from '../lib/supabase/client';
import type { Employee } from './employee.service';

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  is_paid: boolean;
}

export interface LeavePolicy {
  id: string;
  leave_type_id: string;
  allocated_days: number;
  carry_forward: boolean;
  max_carry_forward: number | null;
  leave_types?: LeaveType;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  allocated: number;
  used: number;
  remaining: number;
  year: number;
  leave_types?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  status: string;
  manager_comment: string | null;
  created_at: string;
  employee?: Employee;
  leave_types?: LeaveType;
}

export const leaveService = {
  // Types & Policies
  async getLeaveTypes(companyId: string): Promise<LeaveType[]> {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw error;
    return data as LeaveType[];
  },

  async createLeaveType(companyId: string, data: Partial<LeaveType>): Promise<LeaveType> {
    const { data: result, error } = await supabase
      .from('leave_types')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return result as LeaveType;
  },

  async getLeavePolicies(companyId: string): Promise<LeavePolicy[]> {
    const { data, error } = await supabase
      .from('leave_policies')
      .select('*, leave_types(id, name)')
      .eq('company_id', companyId);
    if (error) throw error;
    return data as LeavePolicy[];
  },

  async createLeavePolicy(companyId: string, data: Partial<LeavePolicy>): Promise<LeavePolicy> {
    const { data: result, error } = await supabase
      .from('leave_policies')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return result as LeavePolicy;
  },

  // Balances
  async getEmployeeBalances(employeeId: string, year: number): Promise<LeaveBalance[]> {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*, leave_types(id, name, is_paid)')
      .eq('employee_id', employeeId)
      .eq('year', year);
    if (error) throw error;
    return data as LeaveBalance[];
  },

  // Requests
  async getMyLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, leave_types(id, name)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as unknown) as LeaveRequest[];
  },

  async getAllPendingRequests(companyId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, employee:employees(id, first_name, last_name, employee_id), leave_types(id, name)')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as unknown) as LeaveRequest[];
  },

  async submitLeaveRequest(companyId: string, employeeId: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const { data: result, error } = await supabase
      .from('leave_requests')
      .insert({
        ...data,
        company_id: companyId,
        employee_id: employeeId,
        status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return result as LeaveRequest;
  },

  async updateRequestStatus(requestId: string, status: 'approved' | 'rejected', managerComment?: string): Promise<LeaveRequest> {
    const { data: request, error: reqError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();
      
    if (reqError) throw reqError;

    // If approving, deduct from balance
    if (status === 'approved') {
      const year = new Date(request.start_date).getFullYear();
      
      const { data: balanceData, error: balError } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', request.employee_id)
        .eq('leave_type_id', request.leave_type_id)
        .eq('year', year)
        .single();
        
      if (!balError && balanceData) {
        const newUsed = balanceData.used + request.number_of_days;
        const newRemaining = balanceData.allocated - newUsed;
        
        await supabase
          .from('leave_balances')
          .update({
            used: newUsed,
            remaining: newRemaining
          })
          .eq('id', balanceData.id);
      }
    }

    const { data: result, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        manager_comment: managerComment || null
      })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;

    // Trigger Notification
    try {
      const { data: empData } = await supabase
        .from('employees')
        .select('profile_id')
        .eq('id', request.employee_id)
        .single();
      
      if (empData && empData.profile_id) {
        const { notificationService } = await import('./notification.service');
        await notificationService.createNotification({
          company_id: request.company_id,
          user_id: empData.profile_id,
          title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your leave request starting on ${new Date(request.start_date).toLocaleDateString()} was ${status}.`,
          type: 'leave_update',
          reference_id: request.id
        });
      }
    } catch (e) {
      console.error('Failed to create notification', e);
    }

    return result as LeaveRequest;
  },

  // Realtime Subscriptions
  subscribeToLeaveRequests(companyId: string, callback: () => void) {
    const channelId = `leave_requests_company_${companyId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_requests',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
