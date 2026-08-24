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

    // 1. Get the current user's membership
    const { data: memberData, error: memberError } = await supabase
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
