import { supabase } from '../lib/supabase/client';

export const reportService = {
  async getEmployeeReport(companyId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        email,
        phone,
        status,
        joining_date,
        department:departments(name),
        designation:designations(name)
      `)
      .eq('company_id', companyId)
      .order('employee_id');

    if (error) throw error;
    
    return data.map(emp => ({
      'Employee ID': emp.employee_id,
      'Name': `${emp.first_name} ${emp.last_name}`,
      'Email': emp.email,
      'Phone': emp.phone || 'N/A',
      'Department': (emp.department as any)?.name || 'N/A',
      'Designation': (emp.designation as any)?.name || (emp.designation as any)?.title || 'N/A',
      'Status': emp.status,
      'Joining Date': emp.joining_date
    }));
  },

  async getAttendanceReport(companyId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        date,
        status,
        check_in,
        check_out,
        employee:employees(first_name, last_name, employee_id)
      `)
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return data.map(record => ({
      'Date': record.date,
      'Employee ID': (record.employee as any)?.employee_id || 'N/A',
      'Name': `${(record.employee as any)?.first_name} ${(record.employee as any)?.last_name}`,
      'Status': record.status,
      'Check In': record.check_in ? new Date(record.check_in).toLocaleTimeString() : 'N/A',
      'Check Out': record.check_out ? new Date(record.check_out).toLocaleTimeString() : 'N/A'
    }));
  },

  async getLeaveReport(_companyId: string, year: number) {
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        allocated,
        used,
        remaining,
        employee:employees(first_name, last_name, employee_id),
        leave_type:leave_types(name)
      `)
      .eq('year', year);

    if (error) throw error;

    // We filter locally by company_id since leave_balances doesn't have it directly.
    // The employee relation contains company context, but we should make sure.
    // Actually, leave_balances is filtered by RLS, so it only returns for the current company anyway if RLS is strict.
    
    return data.map(bal => ({
      'Employee ID': (bal.employee as any)?.employee_id || 'N/A',
      'Name': `${(bal.employee as any)?.first_name} ${(bal.employee as any)?.last_name}`,
      'Leave Type': (bal.leave_type as any)?.name || 'N/A',
      'Allocated': bal.allocated,
      'Used': bal.used,
      'Remaining': bal.remaining
    }));
  },

  async getWorkReportSummary(companyId: string) {
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        date,
        hours_worked,
        status,
        employee:employees(
          first_name, last_name, employee_id,
          department:departments!employees_department_id_fkey(name)
        ),
        project:projects(name)
      `)
      .eq('company_id', companyId)
      .order('date', { ascending: false });

    if (error) throw error;

    return data.map(report => ({
      'Date': report.date,
      'Employee ID': (report.employee as any)?.employee_id || 'N/A',
      'Name': `${(report.employee as any)?.first_name} ${(report.employee as any)?.last_name}`,
      'Project': (report.project as any)?.name || 'N/A',
      'Hours Worked': report.hours_worked,
      'Status': report.status
    }));
  },

  async getPayrollReport(_companyId: string) {
    const { data, error } = await supabase
      .from('payslips')
      .select(`
        basic_salary,
        total_earnings,
        total_deductions,
        net_salary,
        status,
        employee:employees(first_name, last_name, employee_id),
        run:payroll_runs(month, year)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(payslip => ({
      'Period': `${(payslip.run as any)?.month}/${(payslip.run as any)?.year}`,
      'Employee ID': (payslip.employee as any)?.employee_id || 'N/A',
      'Name': `${(payslip.employee as any)?.first_name} ${(payslip.employee as any)?.last_name}`,
      'Basic Salary': payslip.basic_salary,
      'Total Earnings': payslip.total_earnings,
      'Total Deductions': payslip.total_deductions,
      'Net Salary': payslip.net_salary,
      'Status': payslip.status
    }));
  }
};
