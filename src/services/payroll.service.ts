import { supabase } from '../lib/supabase/client';
import type { Employee } from './employee.service';

export interface SalaryComponent {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
  is_percentage: boolean;
  percentage_value: number | null;
  base_component_id: string | null;
}

export interface SalaryStructure {
  id: string;
  name: string;
  description: string | null;
}

export interface EmployeeSalaryStructure {
  id: string;
  employee_id: string;
  salary_structure_id: string;
  base_salary: number;
  effective_date: string;
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: 'draft' | 'processing' | 'approved' | 'paid';
}

export interface Payslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  basic_salary: number;
  total_earnings: number;
  total_deductions: number;
  net_salary: number;
  status: string;
  employee?: Employee;
  run?: { month: number; year: number; status: string };
}

export const payrollService = {
  // Components
  async getSalaryComponents(companyId: string): Promise<SalaryComponent[]> {
    const { data, error } = await supabase
      .from('salary_components')
      .select('*')
      .eq('company_id', companyId);
    if (error) throw error;
    return data as SalaryComponent[];
  },

  async createSalaryComponent(companyId: string, data: Partial<SalaryComponent>): Promise<SalaryComponent> {
    const { data: result, error } = await supabase
      .from('salary_components')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return result as SalaryComponent;
  },

  // Structures
  async getSalaryStructures(companyId: string): Promise<SalaryStructure[]> {
    const { data, error } = await supabase
      .from('salary_structures')
      .select('*')
      .eq('company_id', companyId);
    if (error) throw error;
    return data as SalaryStructure[];
  },

  async createSalaryStructure(companyId: string, data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    const { data: result, error } = await supabase
      .from('salary_structures')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return result as SalaryStructure;
  },

  // Employee Assignment
  async assignStructureToEmployee(companyId: string, data: Partial<EmployeeSalaryStructure>): Promise<EmployeeSalaryStructure> {
    const { data: result, error } = await supabase
      .from('employee_salary_structures')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return result as EmployeeSalaryStructure;
  },
  
  async getEmployeeStructures(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('employee_salary_structures')
      .select('*, employee:employees(id, first_name, last_name, employee_id), structure:salary_structures(id, name)')
      .eq('company_id', companyId);
    if (error) throw error;
    return data;
  },

  // Payroll Runs
  async getPayrollRuns(companyId: string): Promise<PayrollRun[]> {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('company_id', companyId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw error;
    return data as PayrollRun[];
  },

  async createPayrollRun(companyId: string, month: number, year: number): Promise<PayrollRun> {
    const { data: result, error } = await supabase
      .from('payroll_runs')
      .insert({ company_id: companyId, month, year, status: 'draft' })
      .select()
      .single();
    if (error) throw error;
    return result as PayrollRun;
  },

  async updatePayrollRunStatus(runId: string, status: 'draft' | 'processing' | 'approved' | 'paid'): Promise<void> {
    const { error } = await supabase
      .from('payroll_runs')
      .update({ status })
      .eq('id', runId);
    if (error) throw error;
  },

  // Payslips & Engine
  async generateDraftPayslips(companyId: string, runId: string): Promise<void> {
    // 1. Get all active employee salary structures
    const empStructures = await this.getEmployeeStructures(companyId);
    
    // 2. Get all components (for a simpler engine, we apply all components in the company to everyone based on basic_salary)
    const components = await this.getSalaryComponents(companyId);

    const payslipsToInsert = empStructures.map(es => {
      const basic = es.base_salary;
      let earnings = basic;
      let deductions = 0;

      components.forEach(comp => {
        let amount = 0;
        if (comp.is_percentage && comp.percentage_value) {
          amount = (basic * comp.percentage_value) / 100;
        } else if (!comp.is_percentage && comp.percentage_value) {
          // If not percentage, percentage_value acts as a fixed amount in our simplified model
          amount = comp.percentage_value;
        }

        if (comp.type === 'earning') {
          earnings += amount;
        } else {
          deductions += amount;
        }
      });

      return {
        company_id: companyId,
        payroll_run_id: runId,
        employee_id: es.employee_id,
        basic_salary: basic,
        total_earnings: earnings,
        total_deductions: deductions,
        net_salary: earnings - deductions,
        status: 'draft'
      };
    });

    if (payslipsToInsert.length > 0) {
      const { error } = await supabase
        .from('payslips')
        .insert(payslipsToInsert);
      if (error) throw error;
    }
  },

  async getPayslipsForRun(runId: string): Promise<Payslip[]> {
    const { data, error } = await supabase
      .from('payslips')
      .select('*, employee:employees(id, first_name, last_name, employee_id)')
      .eq('payroll_run_id', runId);
    if (error) throw error;
    return (data as unknown) as Payslip[];
  },

  async getMyPayslips(employeeId: string): Promise<Payslip[]> {
    const { data, error } = await supabase
      .from('payslips')
      .select('*, run:payroll_runs(month, year, status)')
      .eq('employee_id', employeeId)
      .order('id', { ascending: false });
    if (error) throw error;
    return (data as unknown) as Payslip[];
  }
};
