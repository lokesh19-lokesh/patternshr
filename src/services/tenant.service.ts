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
    // 1. Get the current user's membership
    const { data: memberData, error: memberError } = await supabase
      .from('company_members')
      .select(`
        company_id,
        role_id,
        companies ( id, name, logo_url ),
        roles ( id, name, is_system_role )
      `)
      .limit(1)
      .single();

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

  async createCompanyWithAdmin(name: string): Promise<string> {
    const { data, error } = await supabase.rpc('create_company_with_admin', {
      new_company_name: name
    });

    if (error) {
      throw error;
    }
    
    // Initialize the 14-day trial
    try {
      const { subscriptionService } = await import('./subscription.service');
      await subscriptionService.initializeTrial(data);
    } catch (e) {
      console.error('Failed to initialize trial:', e);
    }
    
    return data;
  }
};
