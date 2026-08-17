import { supabase } from '../lib/supabase/client';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface Designation {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  level: number;
  status: string;
  department?: Department;
}

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  designation_id: string | null;
  manager_id: string | null;
  joining_date: string;
  date_of_birth: string | null;
  gender: string | null;
  employment_type: string | null;
  status: string;
  address: any | null;
  emergency_contact: any | null;
  department?: Department;
  designation?: Designation;
}

export const employeeService = {
  // Departments
  async getDepartments(companyId: string): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createDepartment(companyId: string, data: Partial<Department>): Promise<Department> {
    const { data: result, error } = await supabase
      .from('departments')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async updateDepartment(companyId: string, id: string, data: Partial<Department>): Promise<Department> {
    const { data: result, error } = await supabase
      .from('departments')
      .update(data)
      .eq('company_id', companyId)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async deleteDepartment(companyId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .update({ status: 'inactive' })
      .eq('company_id', companyId)
      .eq('id', id);
    
    if (error) throw error;
  },

  // Designations
  async getDesignations(companyId: string): Promise<Designation[]> {
    const { data, error } = await supabase
      .from('designations')
      .select(`
        *,
        department:departments(id, name)
      `)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('name');
    
    if (error) throw error;
    return (data as unknown) as Designation[];
  },

  async createDesignation(companyId: string, data: Partial<Designation>): Promise<Designation> {
    const { data: result, error } = await supabase
      .from('designations')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async updateDesignation(companyId: string, id: string, data: Partial<Designation>): Promise<Designation> {
    const { data: result, error } = await supabase
      .from('designations')
      .update(data)
      .eq('company_id', companyId)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async deleteDesignation(companyId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('designations')
      .update({ status: 'inactive' })
      .eq('company_id', companyId)
      .eq('id', id);
    
    if (error) throw error;
  },

  // Employees
  async getEmployees(companyId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id, employee_id, first_name, last_name, email, phone, status, joining_date, department_id, designation_id, manager_id, date_of_birth, gender, employment_type, address, emergency_contact,
        department:departments!employees_department_id_fkey(id, name),
        designation:designations(id, name)
      `)
      .eq('company_id', companyId)
      .order('first_name');
    
    if (error) throw error;
    return (data as unknown) as Employee[];
  },

  async getEmployeeById(companyId: string, id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id, employee_id, first_name, last_name, email, phone, status, joining_date, department_id, designation_id, manager_id, date_of_birth, gender, employment_type, address, emergency_contact,
        department:departments!employees_department_id_fkey(id, name),
        designation:designations(id, name)
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return (data as unknown) as Employee;
  },

  async createEmployee(companyId: string, data: Partial<Employee>): Promise<Employee> {
    // 1. Check current subscription limit
    const { subscriptionService } = await import('./subscription.service');
    const subscription = await subscriptionService.getCurrentSubscription(companyId);
    
    if (subscription && subscription.plan) {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
        
      if (count !== null && count >= subscription.plan.employee_limit) {
        throw new Error(`Employee limit reached. Your current plan allows up to ${subscription.plan.employee_limit} employees. Please upgrade to add more.`);
      }
    }

    // 2. Check if a profile already exists for this email
    let profileId = null;
    if (data.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();
      
      if (profile) {
        profileId = profile.id;
      }
    }

    // 3. Create the employee
    const { data: result, error } = await supabase
      .from('employees')
      .insert({ ...data, company_id: companyId, profile_id: profileId })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async updateEmployee(companyId: string, id: string, data: Partial<Employee>): Promise<Employee> {
    const { data: result, error } = await supabase
      .from('employees')
      .update(data)
      .eq('company_id', companyId)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return result;
  },

  async getCurrentEmployee(companyId: string, userId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('profile_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data as Employee | null;
  }
};
