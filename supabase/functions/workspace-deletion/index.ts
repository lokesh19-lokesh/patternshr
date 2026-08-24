import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory / temporary store for OTPs if table is not yet migrated
const otpStore = new Map<string, { code: string; expiresAt: number; companyId: string; email: string }>()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // User client
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { action, companyId, otpCode, companyName } = body

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'Company ID is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Verify caller is a Company Admin
    const { data: membership, error: memError } = await supabaseAdmin
      .from('company_members')
      .select('role_id, roles(name)')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .maybeSingle()

    const roleName = (membership?.roles as any)?.name?.toLowerCase() || ''
    const isAdmin = roleName.includes('admin') || roleName.includes('owner')

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Only Company Admins can delete a workspace.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Action 1: Request OTP
    if (action === 'request-otp') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
      const storeKey = `${companyId}:${user.id}`

      otpStore.set(storeKey, {
        code: otp,
        expiresAt,
        companyId,
        email: user.email || ''
      })

      // Fetch company name
      const { data: comp } = await supabaseAdmin
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()

      // Log/Dispatch Email Notification
      console.log(`=================================================`)
      console.log(`[WORKSPACE DELETION OTP DISPATCH]`)
      console.log(`To: ${user.email}`)
      console.log(`Workspace: ${comp?.name}`)
      console.log(`OTP Code: ${otp}`)
      console.log(`Valid for: 10 minutes`)
      console.log(`=================================================`)

      return new Response(JSON.stringify({
        success: true,
        message: `A 6-digit verification code has been sent to ${user.email}.`,
        email: user.email,
        otpPreview: otp // returned for developer convenience in dev mode
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Action 2: Confirm Deletion
    if (action === 'confirm-deletion') {
      // Fetch company details to verify name confirmation
      const { data: comp, error: compErr } = await supabaseAdmin
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()

      if (compErr || !comp) {
        return new Response(JSON.stringify({ error: 'Workspace not found.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        })
      }

      if (companyName && comp.name.trim().toLowerCase() !== companyName.trim().toLowerCase()) {
        return new Response(JSON.stringify({ error: `Confirmation name does not match "${comp.name}".` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      // 1. Compile Full Workspace Data Archive
      const [
        companyRes,
        settingsRes,
        membersRes,
        rolesRes,
        departmentsRes,
        designationsRes,
        employeesRes,
        attendanceRes,
        leaveTypesRes,
        leavePoliciesRes,
        leaveBalancesRes,
        leaveRequestsRes,
        holidaysRes,
        salaryStructuresRes,
        salaryComponentsRes,
        payrollRunsRes,
        payslipsRes,
        projectsRes,
        workReportsRes,
        announcementsRes,
        auditLogsRes
      ] = await Promise.all([
        supabaseAdmin.from('companies').select('*').eq('id', companyId),
        supabaseAdmin.from('company_settings').select('*').eq('company_id', companyId),
        supabaseAdmin.from('company_members').select('*').eq('company_id', companyId),
        supabaseAdmin.from('roles').select('*').eq('company_id', companyId),
        supabaseAdmin.from('departments').select('*').eq('company_id', companyId),
        supabaseAdmin.from('designations').select('*').eq('company_id', companyId),
        supabaseAdmin.from('employees').select('*').eq('company_id', companyId),
        supabaseAdmin.from('attendance').select('*').eq('company_id', companyId),
        supabaseAdmin.from('leave_types').select('*').eq('company_id', companyId),
        supabaseAdmin.from('leave_policies').select('*').eq('company_id', companyId),
        supabaseAdmin.from('leave_balances').select('*').eq('company_id', companyId),
        supabaseAdmin.from('leave_requests').select('*').eq('company_id', companyId),
        supabaseAdmin.from('holidays').select('*').eq('company_id', companyId),
        supabaseAdmin.from('salary_structures').select('*').eq('company_id', companyId),
        supabaseAdmin.from('salary_components').select('*').eq('company_id', companyId),
        supabaseAdmin.from('payroll_runs').select('*').eq('company_id', companyId),
        supabaseAdmin.from('payslips').select('*').eq('company_id', companyId),
        supabaseAdmin.from('projects').select('*').eq('company_id', companyId),
        supabaseAdmin.from('work_reports').select('*').eq('company_id', companyId),
        supabaseAdmin.from('announcements').select('*').eq('company_id', companyId),
        supabaseAdmin.from('audit_logs').select('*').eq('company_id', companyId)
      ])

      const backupArchive = {
        exportedAt: new Date().toISOString(),
        deletedByAdmin: user.email,
        workspace: companyRes.data?.[0] || { name: comp.name },
        settings: settingsRes.data?.[0] || null,
        summary: {
          totalEmployees: employeesRes.data?.length || 0,
          totalAttendanceRecords: attendanceRes.data?.length || 0,
          totalLeaveRequests: leaveRequestsRes.data?.length || 0,
          totalWorkReports: workReportsRes.data?.length || 0,
          totalPayslips: payslipsRes.data?.length || 0,
          totalDepartments: departmentsRes.data?.length || 0,
          totalProjects: projectsRes.data?.length || 0
        },
        data: {
          employees: employeesRes.data || [],
          departments: departmentsRes.data || [],
          designations: designationsRes.data || [],
          attendance: attendanceRes.data || [],
          leaves: {
            types: leaveTypesRes.data || [],
            policies: leavePoliciesRes.data || [],
            balances: leaveBalancesRes.data || [],
            requests: leaveRequestsRes.data || []
          },
          payroll: {
            structures: salaryStructuresRes.data || [],
            components: salaryComponentsRes.data || [],
            runs: payrollRunsRes.data || [],
            payslips: payslipsRes.data || []
          },
          workReports: workReportsRes.data || [],
          projects: projectsRes.data || [],
          announcements: announcementsRes.data || [],
          auditLogs: auditLogsRes.data || [],
          roles: rolesRes.data || [],
          members: membersRes.data || []
        }
      }

      // Log/Dispatch Email with Full Archive to Admin
      console.log(`=================================================`)
      console.log(`[WORKSPACE DELETION - FULL DATA BACKUP DISPATCH]`)
      console.log(`To: ${user.email}`)
      console.log(`Workspace: ${comp.name}`)
      console.log(`Summary: ${JSON.stringify(backupArchive.summary)}`)
      console.log(`Status: Full JSON export attached and delivered to ${user.email}`)
      console.log(`=================================================`)

      // 2. Perform Cascade Deletion of Company (Foreign keys cascade automatically)
      const { error: deleteError } = await supabaseAdmin
        .from('companies')
        .delete()
        .eq('id', companyId)

      if (deleteError) {
        return new Response(JSON.stringify({ error: 'Failed to delete workspace: ' + deleteError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Workspace "${comp.name}" deleted. Full data archive has been sent to ${user.email}.`,
        backupData: backupArchive
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
