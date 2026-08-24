import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { SelfServiceWidget } from '../../features/attendance/SelfServiceWidget';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { attendanceService } from '../../services/attendance.service';
import { supabase } from '../../lib/supabase/client';
import {
  Users,
  Clock,
  Calendar,
  FileText,
  DollarSign,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Briefcase,
  CheckCircle2
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { company, role } = useTenant();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0);
  const [todayReportsCount, setTodayReportsCount] = useState<number>(0);
  const [departmentsCount, setDepartmentsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchDashboardStats = async () => {
    if (!company) return;
    try {
      setLoading(true);

      // 1. Fetch Employees
      const empList = await employeeService.getEmployees(company.id);
      setEmployees(empList || []);

      // 2. Fetch Today's Attendance
      const attList = await attendanceService.getTodayAttendance(company.id, todayStr);
      setTodayAttendance(attList || []);

      // 3. Fetch Pending Leaves Count
      const { count: leaveCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('status', 'pending');
      setPendingLeavesCount(leaveCount || 0);

      // 4. Fetch Today's Work Reports Count
      const { count: reportCount } = await supabase
        .from('work_reports')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('date', todayStr);
      setTodayReportsCount(reportCount || 0);

      // 5. Fetch Departments Count
      const { count: deptCount } = await supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('status', 'active');
      setDepartmentsCount(deptCount || 0);

    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [company]);

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const presentToday = todayAttendance.filter(a => !!a.check_in).length;
  const attendanceRate = employees.length > 0 ? Math.round((presentToday / employees.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Welcome & Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-charcoal via-neutral-900 to-dark-green p-7 sm:p-9 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide text-soft-green border border-white/10">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-green" />
              <span>{company?.name} • {role?.name || 'Admin Console'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.email?.split('@')[0]} 👋
            </h1>
            <p className="text-sm text-white/80 max-w-xl leading-relaxed">
              Here is your real-time company overview. You have{' '}
              <span className="font-bold text-white">{presentToday} employee{presentToday === 1 ? '' : 's'} present today</span> and{' '}
              <span className="font-bold text-white">{pendingLeavesCount} pending approval{pendingLeavesCount === 1 ? '' : 's'}</span>.
            </p>
          </div>

          {/* Quick Actions in Hero */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={() => navigate('/dashboard/employees/new')}
              className="inline-flex items-center justify-center space-x-2 bg-primary-green hover:bg-deep-green text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Employee</span>
            </button>
            <button
              onClick={() => navigate('/dashboard/leave/approvals')}
              className="inline-flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-semibold text-sm backdrop-blur-sm transition-all"
            >
              <Calendar className="h-4 w-4" />
              <span>Review Leaves ({pendingLeavesCount})</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-green/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-dark-green/30 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. Self-Service Attendance Time Clock Widget */}
      <SelfServiceWidget />

      {/* 3. Real-Time Key Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Total Employees */}
        <div
          onClick={() => navigate('/dashboard/employees')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-primary-green/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-grey">Total Workforce</span>
            <div className="p-2.5 bg-soft-green text-dark-green rounded-xl group-hover:bg-primary-green group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal">{loading ? '...' : employees.length}</span>
            <span className="text-xs font-semibold text-deep-green">{activeEmployees} active</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-grey pt-3 border-t border-gray-100">
            <span>{departmentsCount} Departments</span>
            <span className="font-semibold text-deep-green group-hover:translate-x-0.5 transition-transform flex items-center">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </div>

        {/* Metric 2: Today's Attendance Rate */}
        <div
          onClick={() => navigate('/dashboard/attendance')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-primary-green/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-grey">Today's Attendance</span>
            <div className="p-2.5 bg-soft-green text-dark-green rounded-xl group-hover:bg-primary-green group-hover:text-white transition-colors">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal">{loading ? '...' : `${attendanceRate}%`}</span>
            <span className="text-xs font-semibold text-text-grey">{presentToday} / {employees.length} present</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-grey pt-3 border-t border-gray-100">
            <span>Live daily roster</span>
            <span className="font-semibold text-deep-green group-hover:translate-x-0.5 transition-transform flex items-center">
              View Roster <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </div>

        {/* Metric 3: Pending Leave Approvals */}
        <div
          onClick={() => navigate('/dashboard/leave/approvals')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-grey">Pending Leaves</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal">{loading ? '...' : pendingLeavesCount}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {pendingLeavesCount > 0 ? 'Requires Action' : 'All Clear'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-grey pt-3 border-t border-gray-100">
            <span>Leave Requests</span>
            <span className="font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center">
              Approve <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </div>

        {/* Metric 4: Work Reports */}
        <div
          onClick={() => navigate('/dashboard/work/reviews')}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-primary-green/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-grey">Daily Work Reports</span>
            <div className="p-2.5 bg-soft-green text-dark-green rounded-xl group-hover:bg-primary-green group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal">{loading ? '...' : todayReportsCount}</span>
            <span className="text-xs font-semibold text-text-grey">Submitted today</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-grey pt-3 border-t border-gray-100">
            <span>Project Tasks</span>
            <span className="font-semibold text-deep-green group-hover:translate-x-0.5 transition-transform flex items-center">
              Review <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Columns: Live Today's Attendance Roster Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Today's Attendance Activity</h3>
                  <p className="text-xs text-gray-500">Live employee check-ins and timestamps for {todayStr}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/attendance')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center"
              >
                <span>Full Roster</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading attendance data...</div>
            ) : todayAttendance.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Clock className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">No attendance activity recorded yet today.</p>
                <p className="text-xs text-gray-400 mt-1">Employees will appear here as they clock in.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 mt-2">
                {todayAttendance.slice(0, 5).map(record => (
                  <div key={record.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {record.employee?.first_name?.[0] || 'E'}{record.employee?.last_name?.[0] || ''}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {record.employee?.first_name} {record.employee?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {record.employee?.designation?.name || record.employee?.department?.name || record.employee?.employee_id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 pl-12 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <div className="text-xs font-bold text-gray-800">
                          {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {record.check_out ? `Out: ${new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'In Progress'}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="text-base font-bold text-charcoal mb-4 flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-dark-green" />
              <span>Management Shortcuts</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <button
                onClick={() => navigate('/dashboard/employees')}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-green hover:bg-soft-green/50 transition-all text-left group"
              >
                <Users className="h-5 w-5 text-primary-green mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-charcoal">Employees</div>
                <div className="text-xs text-text-grey mt-0.5">Directory & Profiles</div>
              </button>

              <button
                onClick={() => navigate('/dashboard/attendance')}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-green hover:bg-soft-green/50 transition-all text-left group"
              >
                <Clock className="h-5 w-5 text-primary-green mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-charcoal">Time Tracking</div>
                <div className="text-xs text-text-grey mt-0.5">Daily Attendance Roster</div>
              </button>

              <button
                onClick={() => navigate('/dashboard/leave/approvals')}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-green hover:bg-soft-green/50 transition-all text-left group"
              >
                <Calendar className="h-5 w-5 text-primary-green mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-charcoal">Leave Approvals</div>
                <div className="text-xs text-text-grey mt-0.5">Review Requests</div>
              </button>

              <button
                onClick={() => navigate('/dashboard/work/reviews')}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-green hover:bg-soft-green/50 transition-all text-left group"
              >
                <FileText className="h-5 w-5 text-primary-green mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-charcoal">Work Reports</div>
                <div className="text-xs text-text-grey mt-0.5">Daily Submissions</div>
              </button>

              <button
                onClick={() => navigate('/dashboard/payroll/processing')}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-green hover:bg-soft-green/50 transition-all text-left group"
              >
                <DollarSign className="h-5 w-5 text-primary-green mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-charcoal">Payroll</div>
                <div className="text-xs text-text-grey mt-0.5">Run & Payslips</div>
              </button>

              <button
                onClick={() => navigate('/dashboard/billing')}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-green hover:bg-soft-green/50 transition-all text-left group"
              >
                <Building2 className="h-5 w-5 text-primary-green mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-charcoal">Billing & Plans</div>
                <div className="text-xs text-text-grey mt-0.5">Workspace Settings</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Summary & Status Widgets */}
        <div className="space-y-6">
          {/* Company Status Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="text-base font-bold text-charcoal mb-4 flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary-green" />
              <span>Workspace Profile</span>
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-text-grey">Organization:</span>
                <span className="font-semibold text-charcoal">{company?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-text-grey">Plan Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-soft-green text-dark-green">
                  Active (Trial)
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-text-grey">Departments:</span>
                <span className="font-semibold text-charcoal">{departmentsCount} Active</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-text-grey">Admin Account:</span>
                <span className="font-semibold text-charcoal truncate max-w-[160px]">{user?.email}</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => navigate('/dashboard/billing')}
                className="w-full py-2.5 px-4 bg-light-grey hover:bg-soft-green hover:text-dark-green text-charcoal font-bold text-xs rounded-xl border border-gray-200 transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Manage Workspace & Subscription</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* System Help & Support Card */}
          <div className="bg-soft-green/60 rounded-2xl border border-primary-green/20 p-6">
            <h4 className="text-sm font-bold text-dark-green flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-primary-green" />
              <span>Patterns HR Operations</span>
            </h4>
            <p className="text-xs text-text-grey mt-2 leading-relaxed">
              All employee records, daily attendance check-ins, leaves, and payroll are automatically synced and secured in real-time.
            </p>
            <div className="mt-4 pt-3 border-t border-primary-green/20 flex items-center justify-between text-xs font-semibold text-dark-green">
              <span>Database Version: 2.0</span>
              <span className="text-primary-green flex items-center">
                <span className="w-2 h-2 rounded-full bg-primary-green mr-1.5 animate-pulse"></span>
                Healthy
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
