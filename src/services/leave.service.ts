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

    if (data && data.length > 0) {
      // Deduplicate by name to guarantee clean unique leave types
      const uniqueTypesMap = new Map<string, LeaveType>();
      data.forEach((t: LeaveType) => {
        if (!uniqueTypesMap.has(t.name)) {
          uniqueTypesMap.set(t.name, t);
        }
      });
      return Array.from(uniqueTypesMap.values());
    }

    // Auto-seed default standard leave types for this company
    const defaultTypes = [
      { name: 'Casual Leave (CL)', description: 'Short-term personal leave', is_paid: true, company_id: companyId },
      { name: 'Sick Leave (SL)', description: 'Medical recovery & health leave', is_paid: true, company_id: companyId },
      { name: 'Paid / Annual Leave (PL)', description: 'Accrued annual vacation leave', is_paid: true, company_id: companyId },
      { name: 'Maternity / Paternity Leave', description: 'Parental leave support', is_paid: true, company_id: companyId },
      { name: 'Unpaid Leave (LOP)', description: 'Loss of pay leave', is_paid: false, company_id: companyId }
    ];

    const { data: inserted, error: insertError } = await supabase
      .from('leave_types')
      .insert(defaultTypes)
      .select();

    if (insertError) {
      console.warn('Could not auto-insert default leave types', insertError);
      return [];
    }

    const uniqueMap = new Map<string, LeaveType>();
    (inserted || []).forEach((t: LeaveType) => {
      if (!uniqueMap.has(t.name)) uniqueMap.set(t.name, t);
    });
    return Array.from(uniqueMap.values());
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

    const defaultAllocations: Record<string, number> = {
      'Casual Leave (CL)': 12,
      'Sick Leave (SL)': 10,
      'Paid / Annual Leave (PL)': 15,
      'Maternity / Paternity Leave': 90,
      'Unpaid Leave (LOP)': 30,
    };

    // If policies exist and have positive days, deduplicate & return
    if (data && data.length > 0) {
      const uniquePolicyMap = new Map<string, LeavePolicy>();
      for (const p of data as LeavePolicy[]) {
        const typeName = p.leave_types?.name;
        if (typeName && !uniquePolicyMap.has(typeName)) {
          // If policy has 0 days, auto-fix to standard default
          if (p.allocated_days === 0 && defaultAllocations[typeName]) {
            const defDays = defaultAllocations[typeName];
            p.allocated_days = defDays;
            supabase
              .from('leave_policies')
              .update({ allocated_days: defDays })
              .eq('id', p.id)
              .then(() => {});
          }
          uniquePolicyMap.set(typeName, p);
        }
      }
      return Array.from(uniquePolicyMap.values());
    }

    // Auto-seed policies if none exist
    const types = await this.getLeaveTypes(companyId);
    if (types.length > 0) {
      const policiesToInsert = types.map((t) => ({
        company_id: companyId,
        leave_type_id: t.id,
        allocated_days: defaultAllocations[t.name] || 12,
        carry_forward: false,
      }));

      const { data: inserted } = await supabase
        .from('leave_policies')
        .insert(policiesToInsert)
        .select('*, leave_types(id, name)');

      return (inserted || []) as LeavePolicy[];
    }

    return (data || []) as LeavePolicy[];
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
    // 1. Fetch employee details to get company_id
    const { data: emp } = await supabase
      .from('employees')
      .select('company_id')
      .eq('id', employeeId)
      .single();

    const companyId = emp?.company_id;

    // 2. Fetch active policies for this company to guarantee dynamic sync
    const policies = companyId ? await this.getLeavePolicies(companyId) : [];
    const policyQuotaMap = new Map<string, number>();
    policies.forEach((p) => {
      if (p.leave_type_id) {
        policyQuotaMap.set(p.leave_type_id, p.allocated_days);
      }
      if (p.leave_types?.name) {
        policyQuotaMap.set(p.leave_types.name, p.allocated_days);
      }
    });

    const defaultAllocations: Record<string, number> = {
      'Casual Leave (CL)': 12,
      'Sick Leave (SL)': 10,
      'Paid / Annual Leave (PL)': 15,
      'Maternity / Paternity Leave': 90,
      'Unpaid Leave (LOP)': 30,
    };

    // 3. Fetch existing employee balances
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*, leave_types(id, name, is_paid)')
      .eq('employee_id', employeeId)
      .eq('year', year);
    if (error) throw error;

    if (data && data.length > 0) {
      const uniqueBalanceMap = new Map<string, LeaveBalance>();

      for (const b of data as LeaveBalance[]) {
        const typeName = b.leave_types?.name || b.leave_type_id;
        const targetQuota = policyQuotaMap.get(b.leave_type_id) || policyQuotaMap.get(typeName) || defaultAllocations[typeName] || 12;

        if (typeName && !uniqueBalanceMap.has(typeName)) {
          // If allocated is 0 or doesn't match active company policy, dynamically sync it!
          if (b.allocated !== targetQuota) {
            b.allocated = targetQuota;
            b.remaining = Math.max(0, targetQuota - (b.used || 0));
            // Sync in DB
            supabase
              .from('leave_balances')
              .update({ allocated: targetQuota, remaining: b.remaining })
              .eq('id', b.id)
              .then(() => {});
          }
          uniqueBalanceMap.set(typeName, b);
        }
      }
      return Array.from(uniqueBalanceMap.values());
    }

    // If no balances exist for this year, create dynamically from policies
    if (companyId) {
      const types = await this.getLeaveTypes(companyId);
      if (types.length > 0) {
        const balancesToInsert = types.map((t) => {
          const quota = policyQuotaMap.get(t.id) || policyQuotaMap.get(t.name) || defaultAllocations[t.name] || 12;
          return {
            company_id: companyId,
            employee_id: employeeId,
            leave_type_id: t.id,
            allocated: quota,
            used: 0,
            remaining: quota,
            year: year,
          };
        });

        const { data: insertedBalances } = await supabase
          .from('leave_balances')
          .insert(balancesToInsert)
          .select('*, leave_types(id, name, is_paid)');

        if (insertedBalances && insertedBalances.length > 0) {
          const uniqueMap = new Map<string, LeaveBalance>();
          insertedBalances.forEach((b: LeaveBalance) => {
            const typeName = b.leave_types?.name || b.leave_type_id;
            if (typeName && !uniqueMap.has(typeName)) {
              uniqueMap.set(typeName, b);
            }
          });
          return Array.from(uniqueMap.values());
        }
      }
    }

    return (data || []) as LeaveBalance[];
  },

  // Update Leave Quota across company & for all employees
  async updateCompanyLeaveQuota(companyId: string, leaveTypeId: string, allocated: number): Promise<void> {
    const year = new Date().getFullYear();

    // 1. Update or upsert company leave policy
    const { data: existingPolicy } = await supabase
      .from('leave_policies')
      .select('id')
      .eq('company_id', companyId)
      .eq('leave_type_id', leaveTypeId)
      .maybeSingle();

    if (existingPolicy) {
      await supabase
        .from('leave_policies')
        .update({ allocated_days: allocated })
        .eq('id', existingPolicy.id);
    } else {
      await supabase
        .from('leave_policies')
        .insert({
          company_id: companyId,
          leave_type_id: leaveTypeId,
          allocated_days: allocated,
          carry_forward: false,
        });
    }

    // 2. Fetch all existing employee balances for this leave type in the current year
    const { data: allBalances } = await supabase
      .from('leave_balances')
      .select('id, used')
      .eq('company_id', companyId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', year);

    if (allBalances && allBalances.length > 0) {
      for (const bal of allBalances) {
        const remaining = Math.max(0, allocated - (bal.used || 0));
        await supabase
          .from('leave_balances')
          .update({
            allocated: allocated,
            remaining: remaining,
          })
          .eq('id', bal.id);
      }
    }
  },

  async updateLeaveBalance(balanceId: string, allocated: number): Promise<void> {
    const { data: current } = await supabase
      .from('leave_balances')
      .select('company_id, leave_type_id, used')
      .eq('id', balanceId)
      .single();

    if (current?.company_id && current?.leave_type_id) {
      // Sync company wide so all employees get the new quota!
      await this.updateCompanyLeaveQuota(current.company_id, current.leave_type_id, allocated);
    } else {
      const used = current?.used || 0;
      const remaining = Math.max(0, allocated - used);
      await supabase
        .from('leave_balances')
        .update({ allocated, remaining })
        .eq('id', balanceId);
    }
  },

  // Requests
  async getMyLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, leave_types:leave_types!leave_type_id(id, name)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: raw } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (!raw || raw.length === 0) return [];

      const typeIds = Array.from(new Set(raw.map((r) => r.leave_type_id).filter(Boolean)));
      const { data: types } = await supabase.from('leave_types').select('id, name').in('id', typeIds);
      const typeMap = new Map((types || []).map((t) => [t.id, t]));

      return raw.map((r) => ({
        ...r,
        leave_types: typeMap.get(r.leave_type_id)
      })) as unknown as LeaveRequest[];
    }

    return (data as unknown) as LeaveRequest[];
  },

  async getAllPendingRequests(companyId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, employee:employees!employee_id(id, first_name, last_name, employee_id), leave_types:leave_types!leave_type_id(id, name)')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('PostgREST join failed, falling back to manual enrichment', error);
      // Direct robust query without ambiguity
      const { data: rawRequests, error: rawError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (rawError || !rawRequests) return [];

      const empIds = Array.from(new Set(rawRequests.map((r) => r.employee_id).filter(Boolean)));
      const typeIds = Array.from(new Set(rawRequests.map((r) => r.leave_type_id).filter(Boolean)));

      const [empsRes, typesRes] = await Promise.all([
        empIds.length > 0 ? supabase.from('employees').select('id, first_name, last_name, employee_id').in('id', empIds) : { data: [] },
        typeIds.length > 0 ? supabase.from('leave_types').select('id, name').in('id', typeIds) : { data: [] }
      ]);

      const empMap = new Map((empsRes.data || []).map((e) => [e.id, e]));
      const typeMap = new Map((typesRes.data || []).map((t) => [t.id, t]));

      return rawRequests.map((r) => ({
        ...r,
        employee: empMap.get(r.employee_id),
        leave_types: typeMap.get(r.leave_type_id)
      })) as unknown as LeaveRequest[];
    }

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
