import React, { useEffect, useState } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { useAuth } from '../../lib/auth/AuthProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { attendanceService } from '../../services/attendance.service';
import type { AttendanceRecord } from '../../services/attendance.service';
import { SelfServiceWidget } from './SelfServiceWidget';

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
      loadData(); // refresh
    } catch (err) {
      console.error('Check in failed', err);
      alert('Failed to check in');
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      await attendanceService.checkOut(attendanceId);
      loadData(); // refresh
    } catch (err) {
      console.error('Check out failed', err);
      alert('Failed to check out');
    }
  };

  // Employee-only view: Self service time clock and personal logs
  if (!isPrivileged) {
    return (
      <div className="space-y-6">
        <SelfServiceWidget />

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">My Attendance History</h3>
              <p className="text-xs text-gray-500">Your recent check-in and check-out records</p>
            </div>
            <button onClick={() => loadData()} className="px-3 py-1.5 border rounded-md text-xs font-medium hover:bg-gray-50">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading attendance...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Hours</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {personalHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No attendance records found</td>
                  </tr>
                ) : (
                  personalHistory.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.check_out ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">Checked Out</span>
                        ) : record.check_in ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Present</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">Absent</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.working_hours ? `${record.working_hours} hrs` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // Admin / HR / Manager view: Full Company Daily Roster
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Roster</h2>
          <p className="text-sm text-gray-500">Manage company-wide attendance for {today}</p>
        </div>
        <button onClick={() => loadData()} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading roster...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No employees found</td>
                </tr>
              ) : (
                employees.map(emp => {
                  const record = attendance[emp.id];
                  const isCheckedIn = !!record?.check_in;
                  const isCheckedOut = !!record?.check_out;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                        <div className="text-sm text-gray-500">{emp.employee_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!isCheckedIn ? (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">Not Checked In</span>
                        ) : isCheckedOut ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">Checked Out</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Present</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record?.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record?.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!isCheckedIn && (
                          <button onClick={() => handleCheckIn(emp.id)} className="text-blue-600 hover:text-blue-900">
                            Check In
                          </button>
                        )}
                        {isCheckedIn && !isCheckedOut && (
                          <button onClick={() => handleCheckOut(record.id)} className="text-orange-600 hover:text-orange-900">
                            Check Out
                          </button>
                        )}
                        {isCheckedOut && (
                          <span className="text-gray-400">Done ({record.working_hours} hrs)</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
