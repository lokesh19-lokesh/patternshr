import { supabase } from '../lib/supabase/client';
import type { Employee } from './employee.service';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  working_hours: number | null;
  employee?: Employee;
}

export const attendanceService = {
  async getTodayAttendance(companyId: string, date: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(id, first_name, last_name, employee_id, department:departments!employees_department_id_fkey(name))
      `)
      .eq('company_id', companyId)
      .eq('date', date);

    if (error) throw error;
    return (data as unknown) as AttendanceRecord[];
  },

  async getEmployeeAttendanceByDate(employeeId: string, date: string): Promise<AttendanceRecord | null> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    return data as AttendanceRecord | null;
  },

  async checkIn(companyId: string, employeeId: string, date: string): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        company_id: companyId,
        employee_id: employeeId,
        date: date,
        check_in: new Date().toISOString(),
        status: 'present'
      })
      .select()
      .single();

    if (error) throw error;
    return data as AttendanceRecord;
  },

  async checkOut(attendanceId: string): Promise<AttendanceRecord> {
    const checkOutTime = new Date();
    
    // Fetch current record to calculate hours
    const { data: record, error: fetchError } = await supabase
      .from('attendance')
      .select('check_in')
      .eq('id', attendanceId)
      .single();

    if (fetchError || !record?.check_in) throw new Error('Cannot checkout without check-in');

    const checkInTime = new Date(record.check_in);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: checkOutTime.toISOString(),
        working_hours: workingHours
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return data as AttendanceRecord;
  }
};
