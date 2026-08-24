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
  project_id: string | null;
  report_date: string;
  hours_worked: number;
  description: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
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
  };
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

  async findOrCreateProject(companyId: string, projectName: string): Promise<string> {
    const trimmed = projectName.trim();
    if (!trimmed) throw new Error('Project name cannot be empty');

    // 1. Search for existing project by name
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('company_id', companyId)
      .ilike('name', trimmed)
      .maybeSingle();

    if (existing) {
      return existing.id;
    }

    // 2. Insert new project
    const { data: created, error } = await supabase
      .from('projects')
      .insert({
        company_id: companyId,
        name: trimmed,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
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

  // Document Upload
  async uploadAttachment(companyId: string, file: File): Promise<{ url: string; name: string }> {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${companyId}/${Date.now()}_${cleanFileName}`;

      // Primary bucket: workreport
      let { data, error } = await supabase.storage
        .from('workreport')
        .upload(storagePath, file, { upsert: true });

      // Fallback bucket if needed
      if (error) {
        const fallbackRes = await supabase.storage
          .from('documents')
          .upload(storagePath, file, { upsert: true });
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('workreport')
          .getPublicUrl(storagePath);

        if (publicUrlData?.publicUrl) {
          return { url: publicUrlData.publicUrl, name: file.name };
        }
      }
    } catch (e) {
      console.warn('Storage upload error, using data URL fallback', e);
    }

    // Fallback: Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result as string, name: file.name });
      };
      reader.readAsDataURL(file);
    });
  },

  // Reports
  async getMyReports(employeeId: string): Promise<WorkReport[]> {
    const { data, error } = await supabase
      .from('work_reports')
      .select('*, project:projects(id, name)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return ((data || []) as any[]).map((r) => ({
      ...r,
      report_date: r.report_date || r.date || r.created_at?.split('T')[0],
      description: r.description || r.tasks_completed || '',
    })) as WorkReport[];
  },

  async getPendingReports(companyId: string): Promise<WorkReport[]> {
    return this.getAllCompanyReports(companyId, 'pending');
  },

  async getAllCompanyReports(companyId: string, status?: string): Promise<WorkReport[]> {
    let query = supabase
      .from('work_reports')
      .select('*, employee:employees(id, first_name, last_name, employee_id), project:projects(id, name)')
      .eq('company_id', companyId);

    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.in('status', ['pending', 'submitted']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('PostgREST join failed in work_reports, falling back to manual enrichment', error);
      let rawQuery = supabase
        .from('work_reports')
        .select('*')
        .eq('company_id', companyId);

      if (status && status !== 'all') {
        if (status === 'pending') {
          rawQuery = rawQuery.in('status', ['pending', 'submitted']);
        } else {
          rawQuery = rawQuery.eq('status', status);
        }
      }

      const { data: rawData, error: rawError } = await rawQuery.order('created_at', { ascending: false });
      if (rawError || !rawData) return [];

      const empIds = Array.from(new Set(rawData.map((r) => r.employee_id).filter(Boolean)));
      const projIds = Array.from(new Set(rawData.map((r) => r.project_id).filter(Boolean)));

      const [empsRes, projsRes] = await Promise.all([
        empIds.length > 0 ? supabase.from('employees').select('id, first_name, last_name, employee_id').in('id', empIds) : { data: [] },
        projIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projIds) : { data: [] }
      ]);

      const empMap = new Map((empsRes.data || []).map((e) => [e.id, e]));
      const projMap = new Map((projsRes.data || []).map((p) => [p.id, p]));

      return rawData.map((r) => ({
        ...r,
        report_date: r.report_date || r.date || r.created_at?.split('T')[0],
        description: r.description || r.tasks_completed || '',
        employee: empMap.get(r.employee_id),
        project: projMap.get(r.project_id),
      })) as unknown as WorkReport[];
    }

    return ((data || []) as any[]).map((r) => ({
      ...r,
      report_date: r.report_date || r.date || r.created_at?.split('T')[0],
      description: r.description || r.tasks_completed || '',
    })) as WorkReport[];
  },

  async submitReport(companyId: string, employeeId: string, data: Partial<WorkReport>): Promise<WorkReport> {
    const dateVal = data.report_date || new Date().toISOString().split('T')[0];
    const descVal = data.description || 'Daily work report';

    // Payload supporting both schema variations
    const payload: any = {
      company_id: companyId,
      employee_id: employeeId,
      project_id: data.project_id || null,
      hours_worked: data.hours_worked || 8,
      status: 'pending',
      attachment_url: data.attachment_url || null,
    };

    // Include both date and report_date, description and tasks_completed
    payload.date = dateVal;
    payload.report_date = dateVal;
    payload.tasks_completed = descVal;
    payload.description = descVal;

    let { data: result, error } = await supabase
      .from('work_reports')
      .insert(payload)
      .select()
      .single();

    // If schema strictly rejected one of the extra columns, sanitize and retry
    if (error) {
      console.warn('Insert with full payload had error, retrying standard schema', error);
      const safePayload = {
        company_id: companyId,
        employee_id: employeeId,
        project_id: data.project_id || null,
        date: dateVal,
        tasks_completed: descVal,
        description: descVal,
        hours_worked: data.hours_worked || 8,
        status: 'pending',
        attachment_url: data.attachment_url || null,
      };

      const retryRes = await supabase
        .from('work_reports')
        .insert(safePayload)
        .select()
        .single();

      if (retryRes.error) {
        // Fallback for minimal schema
        const minimalPayload = {
          company_id: companyId,
          employee_id: employeeId,
          project_id: data.project_id || null,
          report_date: dateVal,
          hours_worked: data.hours_worked || 8,
          description: descVal,
          status: 'pending',
        };
        const minRes = await supabase.from('work_reports').insert(minimalPayload).select().single();
        if (minRes.error) throw minRes.error;
        result = minRes.data;
      } else {
        result = retryRes.data;
      }
    }

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
      .select('*, employee:employees(first_name, last_name)')
      .eq('work_report_id', reportId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      const { data: fallbackData } = await supabase
        .from('work_report_comments')
        .select('*')
        .eq('work_report_id', reportId)
        .order('created_at', { ascending: true });

      return (fallbackData || []).map((c: any) => ({
        id: c.id,
        report_id: c.work_report_id || c.report_id || reportId,
        author_id: c.employee_id || c.author_id || '',
        comment_text: c.comment || c.comment_text || '',
        created_at: c.created_at,
        author: c.employee ? { first_name: c.employee.first_name, last_name: c.employee.last_name } : undefined,
      }));
    }

    return data.map((c: any) => ({
      id: c.id,
      report_id: c.work_report_id || c.report_id || reportId,
      author_id: c.employee_id || c.author_id || '',
      comment_text: c.comment || c.comment_text || '',
      created_at: c.created_at,
      author: c.employee ? { first_name: c.employee.first_name, last_name: c.employee.last_name } : undefined,
    }));
  },

  async addReportComment(companyId: string, reportId: string, authorId: string, text: string): Promise<WorkReportComment> {
    // Check if authorId is an employee in this company
    let validEmployeeId: string | null = null;
    try {
      // 1. Check if authorId is already a valid employee ID
      const { data: empById } = await supabase
        .from('employees')
        .select('id')
        .eq('company_id', companyId)
        .eq('id', authorId)
        .maybeSingle();

      if (empById?.id) {
        validEmployeeId = empById.id;
      } else {
        // 2. Check if authorId is user_id in employees table
        const { data: empByUser } = await supabase
          .from('employees')
          .select('id')
          .eq('company_id', companyId)
          .eq('user_id', authorId)
          .maybeSingle();

        if (empByUser?.id) {
          validEmployeeId = empByUser.id;
        }
      }
    } catch (e) {
      console.warn('Could not resolve employee for comment author', e);
    }

    const payload = {
      company_id: companyId,
      work_report_id: reportId,
      employee_id: validEmployeeId,
      comment: text,
    };

    const { data, error } = await supabase
      .from('work_report_comments')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Failed to insert work report comment', error);
      throw error;
    }

    return {
      id: data.id,
      report_id: data.work_report_id || reportId,
      author_id: data.employee_id || authorId,
      comment_text: data.comment || text,
      created_at: data.created_at || new Date().toISOString(),
    };
  },

  // Document Viewer/Downloader
  openDocument(url: string, fileName?: string) {
    if (!url) return;

    if (url.startsWith('data:')) {
      try {
        const arr = url.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        if (fileName) a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
        return;
      } catch (e) {
        console.error('Error opening Base64 document', e);
      }
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  },

  // Realtime Subscriptions
  subscribeToWorkReports(companyId: string, callback: () => void) {
    const channelId = `work_reports_company_${companyId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_reports',
        },
        (payload: any) => {
          if (!payload.new || payload.new.company_id === companyId || !payload.new.company_id) {
            callback();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_report_comments',
        },
        (payload: any) => {
          if (!payload.new || payload.new.company_id === companyId || !payload.new.company_id) {
            callback();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToReportComments(reportId: string, callback: () => void) {
    const channelId = `work_comments_rep_${reportId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_report_comments',
        },
        (payload: any) => {
          if (
            payload.new?.work_report_id === reportId ||
            payload.new?.report_id === reportId ||
            payload.old?.work_report_id === reportId
          ) {
            callback();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
