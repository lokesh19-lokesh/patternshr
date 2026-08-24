import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { attendanceService } from '../../services/attendance.service';
import type { AttendanceRecord } from '../../services/attendance.service';
import { Clock, CheckCircle, LogIn, LogOut, Sparkles } from 'lucide-react';

export const SelfServiceWidget: React.FC = () => {
  const { user } = useAuth();
  const { company } = useTenant();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async (isBackground = false) => {
    if (!company || !user) return;
    try {
      if (!isBackground) setLoading(true);
      const emp = await employeeService.getCurrentEmployee(company.id, user.id, user.email);
      setEmployee(emp);

      if (emp) {
        const record = await attendanceService.getEmployeeAttendanceByDate(emp.id, today);
        setTodayRecord(record);
      }
    } catch (err) {
      console.error('Failed to load employee self-service data:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!company) return;

    // Realtime subscription for instant auto-sync
    const unsubscribe = attendanceService.subscribeToAttendance(company.id, () => {
      loadData(true);
    });

    return () => {
      unsubscribe();
    };
  }, [company, user]);

  const handleLinkProfile = async () => {
    if (!company || !user?.email) return;
    try {
      setLinking(true);
      const newEmp = await employeeService.createAdminEmployeeProfile(
        company.id,
        user.id,
        user.email,
        user.email.split('@')[0].toUpperCase(),
        'Admin'
      );
      setEmployee(newEmp);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert('Failed to link profile: ' + err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleCheckIn = async () => {
    if (!company || !employee) return;
    try {
      setActionLoading(true);
      await attendanceService.checkIn(company.id, employee.id, today);
      await loadData(true);
    } catch (err: any) {
      console.error(err);
      alert('Check in failed: ' + (err.message || 'Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      setActionLoading(true);
      await attendanceService.checkOut(todayRecord.id);
      await loadData(true);
    } catch (err: any) {
      console.error(err);
      alert('Check out failed: ' + (err.message || 'Please try again.'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-44 rounded-2xl border border-gray-200"></div>;
  }

  // If user is not linked to an employee record, provide 1-click activation
  if (!employee) {
    return (
      <div className="bg-soft-green border border-primary-green/30 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 text-center md:text-left">
          <div className="p-3 bg-primary-green text-white rounded-xl shadow-md">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal">Activate Self-Service Time Clock</h3>
            <p className="text-xs text-text-grey mt-0.5">
              Link your admin account ({user?.email}) to enable one-click clock-in, break tracking, and daily work logs.
            </p>
          </div>
        </div>
        <button
          onClick={handleLinkProfile}
          disabled={linking}
          className="inline-flex items-center space-x-2 bg-primary-green hover:bg-deep-green text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex-shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          <span>{linking ? 'Linking Profile...' : 'Enable Time Clock'}</span>
        </button>
      </div>
    );
  }

  const isCheckedIn = !!todayRecord?.check_in;
  const isCheckedOut = !!todayRecord?.check_out;

  return (
    <div className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 border border-gray-200/80">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Info & Digital Clock */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h3 className="text-lg font-bold text-charcoal">Time Clock</h3>
            {isCheckedIn && !isCheckedOut && (
              <span className="inline-flex items-center space-x-1 bg-soft-green text-dark-green border border-primary-green/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-green animate-pulse"></span>
                <span>Active</span>
              </span>
            )}
            {isCheckedOut && (
              <span className="inline-flex items-center space-x-1 bg-light-grey text-charcoal border border-gray-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <CheckCircle className="w-3 h-3 text-text-grey" />
                <span>Completed</span>
              </span>
            )}
          </div>
          <p className="text-xs text-text-grey">
            Welcome back, <span className="font-semibold text-charcoal">{employee.first_name} {employee.last_name}</span> ({employee.employee_id})
          </p>

          <div className="pt-2 flex items-baseline space-x-3">
            <div className="text-3xl font-extrabold tracking-tight font-mono text-charcoal">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs font-medium text-text-grey">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="w-full sm:w-44 py-3 bg-primary-green hover:bg-deep-green active:scale-98 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>{actionLoading ? 'Clocking in...' : 'Clock In Now'}</span>
            </button>
          ) : isCheckedOut ? (
            <div className="w-full sm:w-52 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Shift Completed</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">
                {todayRecord?.working_hours ? `${todayRecord.working_hours} hrs logged` : 'Logged for today'}
              </div>
            </div>
          ) : (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="w-full sm:w-44 py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{actionLoading ? 'Clocking out...' : 'Clock Out'}</span>
            </button>
          )}

          {/* Timestamps */}
          {(isCheckedIn || isCheckedOut) && (
            <div className="text-xs text-gray-600 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100 space-y-1">
              {isCheckedIn && (
                <div className="flex items-center justify-between space-x-2">
                  <span className="text-gray-400">Clock In:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(todayRecord?.check_in!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {isCheckedOut && (
                <div className="flex items-center justify-between space-x-2">
                  <span className="text-gray-400">Clock Out:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(todayRecord?.check_out!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
