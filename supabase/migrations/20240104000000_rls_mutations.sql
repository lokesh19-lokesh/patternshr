-- RLS Mutations for Tenant Isolation

DO $$
DECLARE
  table_name text;
  tables_to_secure text[] := ARRAY[
    'company_settings', 'roles', 'designations', 'attendance', 'attendance_corrections',
    'leave_types', 'leave_policies', 'leave_balances', 'leave_requests', 'holidays',
    'salary_structures', 'salary_components', 'employee_salary_structures', 'payroll_runs',
    'payslips', 'projects', 'work_reports', 'work_report_comments', 'documents', 'announcements',
    'notifications', 'audit_logs', 'employees', 'departments', 'company_members'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_secure
  LOOP
    -- Insert Policy
    EXECUTE format(
      'CREATE POLICY "Tenant isolation for insert on %I" ON public.%I FOR INSERT WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));',
      table_name, table_name
    );
    -- Update Policy
    EXECUTE format(
      'CREATE POLICY "Tenant isolation for update on %I" ON public.%I FOR UPDATE USING (company_id IN (SELECT public.get_user_company_ids())) WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));',
      table_name, table_name
    );
    -- Delete Policy
    EXECUTE format(
      'CREATE POLICY "Tenant isolation for delete on %I" ON public.%I FOR DELETE USING (company_id IN (SELECT public.get_user_company_ids()));',
      table_name, table_name
    );
  END LOOP;
END $$;
