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
  joining_date: string;
  status: string;
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

  // Employees
  async getEmployees(companyId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id, employee_id, first_name, last_name, email, phone, status, joining_date, department_id, designation_id,
        department:departments(id, name),
        designation:designations(id, name)
      `)
      .eq('company_id', companyId)
      .order('first_name');
    
    if (error) throw error;
    return (data as unknown) as Employee[];
  },

  async createEmployee(companyId: string, data: Partial<Employee>): Promise<Employee> {
    const { data: result, error } = await supabase
      .from('employees')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
};
