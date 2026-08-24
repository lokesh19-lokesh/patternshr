import { supabase } from '../lib/supabase/client';
import type { Employee } from './employee.service';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export interface WorkReport {
  id: string;
  employee_id: string;
  project_id: string;
  report_date: string;
  hours_worked: number;
  description: string;
  status: string;
  created_at: string;
  employee?: Employee;
  project?: Project;
}

export interface WorkReportComment {
  id: string;
  report_id: string;
  author_id: string;
  comment_text: string;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
  }; // In a real app, author_id might link to profiles, but we can do a simple join if we need names. We'll stick to basic text for MVP.
}

export const workService = {
  // Projects
  async getProjects(companyId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw error;
    return data as Project[];
  },

  async createProject(companyId: string, data: Partial<Project>): Promise<Project> {
    const { data: result, error } = await supabase
      .from('projects')
      .insert({ ...data, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return result as Project;
  },

  // Reports
  async getMyReports(employeeId: string): Promise<WorkReport[]> {
    const { data, error } = await supabase
      .from('work_reports')
      .select('*, project:projects(id, name)')
      .eq('employee_id', employeeId)
      .order('report_date', { ascending: false });
    if (error) throw error;
    return (data as unknown) as WorkReport[];
  },

  async getPendingReports(companyId: string): Promise<WorkReport[]> {
    const { data, error } = await supabase
      .from('work_reports')
      .select('*, employee:employees(id, first_name, last_name, employee_id), project:projects(id, name)')
      .eq('company_id', companyId)
      .in('status', ['pending', 'needs_revision'])
      .order('report_date', { ascending: false });
    if (error) throw error;
    return (data as unknown) as WorkReport[];
  },

  async submitReport(companyId: string, employeeId: string, data: Partial<WorkReport>): Promise<WorkReport> {
    const { data: result, error } = await supabase
      .from('work_reports')
      .insert({
        ...data,
        company_id: companyId,
        employee_id: employeeId,
        status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return result as WorkReport;
  },

  async updateReportStatus(reportId: string, status: 'approved' | 'needs_revision'): Promise<WorkReport> {
    const { data: result, error } = await supabase
      .from('work_reports')
      .update({ status })
      .eq('id', reportId)
      .select()
      .single();
    
    if (error) throw error;
    return result as WorkReport;
  },

  // Comments
  async getReportComments(reportId: string): Promise<WorkReportComment[]> {
    const { data, error } = await supabase
      .from('work_report_comments')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as WorkReportComment[];
  },

  async addReportComment(reportId: string, authorId: string, text: string): Promise<WorkReportComment> {
    const { data, error } = await supabase
      .from('work_report_comments')
      .insert({
        report_id: reportId,
        author_id: authorId,
        comment_text: text
      })
      .select()
      .single();
    if (error) throw error;
    return data as WorkReportComment;
  },

  // Realtime Subscriptions
  subscribeToWorkReports(companyId: string, callback: () => void) {
    const channel = supabase
      .channel(`work_reports_company_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_reports',
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
