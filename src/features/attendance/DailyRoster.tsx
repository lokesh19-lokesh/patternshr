import React, { useEffect, useState } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { useAuth } from '../../lib/auth/AuthProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { attendanceService } from '../../services/attendance.service';
import type { AttendanceRecord } from '../../services/attendance.service';
import { SelfServiceWidget } from './SelfServiceWidget';
import { Clock, RefreshCw, CheckCircle2, LogIn, LogOut, UserCheck } from 'lucide-react';

export const DailyRoster: React.FC = () => {
  const { company, role } = useTenant();
  const { user } = useAuth();
  
  const normalizedRole = role?.name?.toLowerCase() || '';
  const isPrivileged = normalizedRole.includes('admin') || normalizedRole.includes('hr') || normalizedRole.includes('manager') || normalizedRole.includes('owner');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [personalHistory, setPersonalHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current date string in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const loadData = async (isBackground = false) => {
    if (!company || !user) return;
    try {
      if (!isBackground) setLoading(true);

      if (isPrivileged) {
        // Admin / HR / Manager view: All employees
        const [emps, records] = await Promise.all([
          employeeService.getEmployees(company.id),
          attendanceService.getTodayAttendance(company.id, today)
        ]);

        const attendanceMap: Record<string, AttendanceRecord> = {};
        records.forEach(r => {
          attendanceMap[r.employee_id] = r;
        });

        setEmployees(emps);
        setAttendance(attendanceMap);
      } else {
        // Employee view: Only personal attendance records
        const currentEmp = await employeeService.getCurrentEmployee(company.id, user.id);
        if (currentEmp) {
          const history = await attendanceService.getEmployeeAttendanceHistory(currentEmp.id);
          setPersonalHistory(history);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!company) return;

    // Realtime subscription for instant auto-sync across browsers
    const unsubscribe = attendanceService.subscribeToAttendance(company.id, () => {
      loadData(true);
    });

    return () => {
      unsubscribe();
    };
  }, [company, user, isPrivileged]);

  const handleCheckIn = async (employeeId: string) => {
    if (!company) return;
    try {
      await attendanceService.checkIn(company.id, employeeId, today);
      loadData();
    } catch (err) {
      console.error('Check in failed', err);
      alert('Failed to check in');
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      await attendanceService.checkOut(attendanceId);
      loadData();
    } catch (err) {
      console.error('Check out failed', err);
      alert('Failed to check out');
    }
  };

  // Helper status badge renderer
  const renderStatusBadge = (isCheckedIn: boolean, isCheckedOut: boolean) => {
    if (!isCheckedIn) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-text-grey border border-gray-200">
          Not Checked In
        </span>
      );
    }
    if (isCheckedOut) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-light-grey text-charcoal border border-gray-200">
          <CheckCircle2 className="w-3 h-3 text-text-grey" />
          <span>Checked Out</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-soft-green text-dark-green border border-primary-green/30">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-green animate-pulse"></span>
        <span>Present</span>
      </span>
    );
  };

  // Employee-only view: Self service time clock and personal logs
  if (!isPrivileged) {
    return (
      <div className="space-y-6">
        <SelfServiceWidget />

        <div className="bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-charcoal">My Attendance History</h3>
              <p className="text-xs text-text-grey mt-0.5">Your recent check-in and check-out logs</p>
            </div>
            <button
              onClick={() => loadData()}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-light-grey hover:bg-soft-green text-charcoal hover:text-dark-green border border-gray-200 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-text-grey text-sm">Loading attendance...</div>
          ) : personalHistory.length === 0 ? (
            <div className="p-8 text-center text-text-grey text-sm">No attendance records found.</div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="block md:hidden divide-y divide-gray-100">
                {personalHistory.map((record) => (
                  <div key={record.id} className="p-4 space-y-2.5 hover:bg-light-grey/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-charcoal">{record.date}</span>
                      {renderStatusBadge(!!record.check_in, !!record.check_out)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-text-grey pt-1">
                      <div className="bg-light-grey p-2 rounded-lg">
                        <span className="block text-[10px] uppercase font-bold text-text-grey">Check In</span>
                        <span className="font-semibold text-charcoal text-xs">
                          {record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}
                        </span>
                      </div>
                      <div className="bg-light-grey p-2 rounded-lg">
                        <span className="block text-[10px] uppercase font-bold text-text-grey">Check Out</span>
                        <span className="font-semibold text-charcoal text-xs">
                          {record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}
                        </span>
                      </div>
                    </div>
                    {record.working_hours && (
                      <div className="text-xs font-medium text-dark-green bg-soft-green px-2.5 py-1 rounded-md text-right">
                        Total: {record.working_hours} hrs
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-light-grey">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Working Hours</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {personalHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-light-grey/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                          {record.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(!!record.check_in, !!record.check_out)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-grey">
                          {record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-grey">
                          {record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                          {record.working_hours ? `${record.working_hours} hrs` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Admin / HR / Manager view: Full Company Daily Roster
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary-green" />
            <span>Daily Roster</span>
          </h2>
          <p className="text-xs sm:text-sm text-text-grey mt-0.5">
            Manage and monitor company-wide attendance for <span className="font-semibold text-charcoal">{today}</span>
          </p>
        </div>
        <button
          onClick={() => loadData()}
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-white hover:bg-soft-green text-charcoal hover:text-dark-green border border-gray-200/80 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4 text-primary-green" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-grey text-sm">Loading daily attendance roster...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-text-grey text-sm">No employees found in this workspace.</div>
        ) : (
          <>
            {/* Mobile View: High-density responsive cards */}
            <div className="block md:hidden divide-y divide-gray-100">
              {employees.map((emp) => {
                const record = attendance[emp.id];
                const isCheckedIn = !!record?.check_in;
                const isCheckedOut = !!record?.check_out;

                return (
                  <div key={emp.id} className="p-4 space-y-3 hover:bg-light-grey/40 transition-colors">
                    {/* Top row: Name, ID, and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-charcoal leading-tight">
                          {emp.first_name} {emp.last_name}
                        </h4>
                        <span className="text-xs text-text-grey">{emp.employee_id || 'No ID'}</span>
                      </div>
                      <div>{renderStatusBadge(isCheckedIn, isCheckedOut)}</div>
                    </div>

                    {/* Time details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-light-grey p-2.5 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-1 text-text-grey mb-1">
                          <Clock className="h-3 w-3 text-primary-green" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Check In</span>
                        </div>
                        <span className="font-semibold text-charcoal">
                          {record?.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </span>
                      </div>

                      <div className="bg-light-grey p-2.5 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-1 text-text-grey mb-1">
                          <Clock className="h-3 w-3 text-text-grey" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Check Out</span>
                        </div>
                        <span className="font-semibold text-charcoal">
                          {record?.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-1">
                      {!isCheckedIn && (
                        <button
                          onClick={() => handleCheckIn(emp.id)}
                          className="w-full py-2.5 bg-primary-green hover:bg-deep-green active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          <span>Check In Employee</span>
                        </button>
                      )}
                      {isCheckedIn && !isCheckedOut && (
                        <button
                          onClick={() => handleCheckOut(record.id)}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Check Out Employee</span>
                        </button>
                      )}
                      {isCheckedOut && (
                        <div className="w-full py-2 bg-light-grey text-text-grey rounded-xl text-xs font-semibold text-center border border-gray-100">
                          Shift Complete {record.working_hours ? `(${record.working_hours} hrs)` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Data Table with horizontal scroll support */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-light-grey">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {employees.map((emp) => {
                    const record = attendance[emp.id];
                    const isCheckedIn = !!record?.check_in;
                    const isCheckedOut = !!record?.check_out;

                    return (
                      <tr key={emp.id} className="hover:bg-light-grey/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-charcoal">{emp.first_name} {emp.last_name}</div>
                          <div className="text-xs text-text-grey mt-0.5">{emp.employee_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(isCheckedIn, isCheckedOut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-grey font-mono">
                          {record?.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-grey font-mono">
                          {record?.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          {!isCheckedIn && (
                            <button
                              onClick={() => handleCheckIn(emp.id)}
                              className="text-primary-green hover:text-deep-green font-bold transition-colors"
                            >
                              Check In
                            </button>
                          )}
                          {isCheckedIn && !isCheckedOut && (
                            <button
                              onClick={() => handleCheckOut(record.id)}
                              className="text-amber-600 hover:text-amber-700 font-bold transition-colors"
                            >
                              Check Out
                            </button>
                          )}
                          {isCheckedOut && (
                            <span className="text-text-grey text-xs">Done ({record.working_hours} hrs)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

