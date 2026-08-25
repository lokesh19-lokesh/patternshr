import { supabase } from '../lib/supabase/client';

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface Role {
  id: string;
  name: string;
  is_system_role: boolean;
}

export interface Permission {
  id: string;
  action: string;
  module: string;
}

export interface TenantContextData {
  company: Company | null;
  role: Role | null;
  permissions: string[];
}

export const tenantService = {
  async getUserTenantData(): Promise<TenantContextData | null> {
    // 0. Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 0.1 Try auto-claiming company membership via SECURITY DEFINER RPC (bypasses RLS)
    try {
      await supabase.rpc('claim_employee_membership');
    } catch {
      // Fallback handled below
    }

    // 1. Get the current user's membership
    let { data: memberData, error: memberError } = await supabase
      .from('company_members')
      .select(`
        company_id,
        role_id,
        user_id,
        companies ( id, name, logo_url ),
        roles ( id, name, is_system_role )
      `)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    // 1.1 If not found in company_members, check if an employee record exists with this user's email
    if ((!memberData || memberError) && user.email) {
      const { data: empRecord } = await supabase
        .from('employees')
        .select(`
          id, 
          company_id, 
          designation_id,
          designations ( name )
        `)
        .ilike('email', user.email.trim())
        .limit(1)
        .maybeSingle();

      if (empRecord?.company_id) {
        // @ts-ignore
        const desigName = empRecord.designations?.name || '';
        const isExecutive = /founder|ceo|director|admin/i.test(desigName);
        
        let roleQuery = supabase
          .from('roles')
          .select('id')
          .eq('company_id', empRecord.company_id);

        if (isExecutive) {
          roleQuery = roleQuery.ilike('name', '%admin%');
        } else {
          roleQuery = roleQuery.ilike('name', 'employee');
        }

        const { data: matchedRole } = await roleQuery.limit(1).maybeSingle();
        let roleId = matchedRole?.id;

        if (!roleId) {
          const { data: fallbackRole } = await supabase
            .from('roles')
            .select('id')
            .eq('company_id', empRecord.company_id)
            .limit(1)
            .maybeSingle();
          roleId = fallbackRole?.id;
        }

        // Link user to company_members
        await supabase.from('company_members').upsert({
          company_id: empRecord.company_id,
          user_id: user.id,
          role_id: roleId || null
        }, { onConflict: 'company_id, user_id' });

        // Link profile_id on employee record
        await supabase
          .from('employees')
          .update({ profile_id: user.id })
          .eq('id', empRecord.id);

        // Re-fetch memberData
        const { data: refreshedMember } = await supabase
          .from('company_members')
          .select(`
            company_id,
            role_id,
            user_id,
            companies ( id, name, logo_url ),
            roles ( id, name, is_system_role )
          `)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        memberData = refreshedMember;
        memberError = null;
      }
    }

    if (memberError || !memberData) {
      return null;
    }

    // 2. Fetch permissions for the role
    let permissions: string[] = [];
    if (memberData.role_id) {
      const { data: permData, error: permError } = await supabase
        .from('role_permissions')
        .select(`
          permissions ( action )
        `)
        .eq('role_id', memberData.role_id);

      if (!permError && permData) {
        // Handle TS typing for joined tables gracefully
        permissions = permData
          .map((row: any) => row.permissions?.action)
          .filter(Boolean);
      }
    }

    return {
      // @ts-ignore: Supabase join typing workaround
      company: memberData.companies as Company,
      // @ts-ignore: Supabase join typing workaround
      role: memberData.roles as Role,
      permissions
    };
  },

  async checkWorkspaceNameExists(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', trimmed)
      .limit(1);
    if (error) return false;
    return !!(data && data.length > 0);
  },

  async createCompanyWithAdmin(name: string): Promise<string> {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new Error('Workspace name must be at least 2 characters.');
    }

    // 1. Check if the current user already belongs to any workspace
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (existingMember) {
        throw new Error('Your account is already associated with an existing workspace.');
      }
    }

    // 2. Check if a workspace with this name already exists
    const exists = await this.checkWorkspaceNameExists(trimmed);
    if (exists) {
      throw new Error(`A workspace named "${trimmed}" already exists. Please choose a different name or ask your administrator to send you an invitation.`);
    }

    const { data, error } = await supabase.rpc('create_company_with_admin', {
      new_company_name: trimmed
    });

    if (error) {
      throw error;
    }

    // Link workspace in Supabase Auth user metadata so it displays in Supabase Dashboard > Authentication > Users
    try {
      await supabase.auth.updateUser({
        data: {
          workspace_name: trimmed,
          company_id: data,
          role: 'Company Admin'
        }
      });
    } catch (e) {
      console.warn('Failed to update auth metadata with workspace:', e);
    }
    
    // Initialize the 14-day trial
    try {
      const { subscriptionService } = await import('./subscription.service');
      await subscriptionService.initializeTrial(data);
    } catch (e) {
      console.error('Failed to initialize trial:', e);
    }
    
    return data;
  },

  async requestWorkspaceDeletionOtp(email: string): Promise<{ email: string }> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) {
      throw error;
    }

    return { email };
  },

  async verifyAndDeleteWorkspace(companyId: string, email: string, otpCode: string, companyName: string, userId?: string): Promise<any> {
    // 1. Verify OTP with Supabase Auth
    let verifyError: any = null;
    const res1 = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: 'email'
    });

    if (res1.error) {
      const res2 = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: 'magiclink' as any
      });
      if (res2.error) {
        verifyError = res1.error;
      }
    }

    if (verifyError) {
      throw new Error('Invalid or expired OTP code: ' + verifyError.message);
    }

    // 2. Compile full workspace backup archive across all tables
    const [
      companyRes,
      settingsRes,
      membersRes,
      rolesRes,
      departmentsRes,
      designationsRes,
      employeesRes,
      attendanceRes,
      leaveTypesRes,
      leavePoliciesRes,
      leaveBalancesRes,
      leaveRequestsRes,
      salaryStructuresRes,
      salaryComponentsRes,
      payrollRunsRes,
      payslipsRes,
      projectsRes,
      workReportsRes
    ] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId),
      supabase.from('company_settings').select('*').eq('company_id', companyId),
      supabase.from('company_members').select('*').eq('company_id', companyId),
      supabase.from('roles').select('*').eq('company_id', companyId),
      supabase.from('departments').select('*').eq('company_id', companyId),
      supabase.from('designations').select('*').eq('company_id', companyId),
      supabase.from('employees').select('*').eq('company_id', companyId),
      supabase.from('attendance').select('*').eq('company_id', companyId),
      supabase.from('leave_types').select('*').eq('company_id', companyId),
      supabase.from('leave_policies').select('*').eq('company_id', companyId),
      supabase.from('leave_balances').select('*').eq('company_id', companyId),
      supabase.from('leave_requests').select('*').eq('company_id', companyId),
      supabase.from('salary_structures').select('*').eq('company_id', companyId),
      supabase.from('salary_components').select('*').eq('company_id', companyId),
      supabase.from('payroll_runs').select('*').eq('company_id', companyId),
      supabase.from('payslips').select('*').eq('company_id', companyId),
      supabase.from('projects').select('*').eq('company_id', companyId),
      supabase.from('work_reports').select('*').eq('company_id', companyId),
    ]);

    const fullBackup = {
      exportedAt: new Date().toISOString(),
      deletedByAdmin: email,
      workspace: companyRes.data?.[0] || { name: companyName },
      settings: settingsRes.data?.[0] || null,
      summary: {
        totalEmployees: employeesRes.data?.length || 0,
        totalAttendanceRecords: attendanceRes.data?.length || 0,
        totalLeaveRequests: leaveRequestsRes.data?.length || 0,
        totalWorkReports: workReportsRes.data?.length || 0,
        totalPayslips: payslipsRes.data?.length || 0,
        totalDepartments: departmentsRes.data?.length || 0
      },
      data: {
        employees: employeesRes.data || [],
        departments: departmentsRes.data || [],
        designations: designationsRes.data || [],
        attendance: attendanceRes.data || [],
        leaves: {
          types: leaveTypesRes.data || [],
          policies: leavePoliciesRes.data || [],
          balances: leaveBalancesRes.data || [],
          requests: leaveRequestsRes.data || []
        },
        payroll: {
          structures: salaryStructuresRes.data || [],
          components: salaryComponentsRes.data || [],
          runs: payrollRunsRes.data || [],
          payslips: payslipsRes.data || []
        },
        workReports: workReportsRes.data || [],
        projects: projectsRes.data || [],
        roles: rolesRes.data || [],
        members: membersRes.data || []
      }
    };

    // 3. Delete the company and cascade tables
    await supabase.from('companies').delete().eq('id', companyId);

    // 4. Delete user auth accounts associated with the workspace
    if (userId) {
      try {
        await supabase.rpc('delete_workspace_and_user_accounts', {
          p_company_id: companyId,
          p_admin_user_id: userId
        });
      } catch (e) {
        console.warn('RPC delete_workspace_and_user_accounts fallback:', e);
      }
    }

    return fullBackup;
  }
};
