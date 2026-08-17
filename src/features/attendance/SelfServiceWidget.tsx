import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { attendanceService } from '../../services/attendance.service';
import type { AttendanceRecord } from '../../services/attendance.service';
import { Clock } from 'lucide-react';

export const SelfServiceWidget: React.FC = () => {
  const { user } = useAuth();
  const { company } = useTenant();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!company || !user) return;
    try {
      setLoading(true);
      const emp = await employeeService.getCurrentEmployee(company.id, user.id);
      setEmployee(emp);

      if (emp) {
        const record = await attendanceService.getEmployeeAttendanceByDate(emp.id, today);
        setTodayRecord(record);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company, user]);

  const handleCheckIn = async () => {
    if (!company || !employee) return;
    try {
      await attendanceService.checkIn(company.id, employee.id, today);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Check in failed');
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      await attendanceService.checkOut(todayRecord.id);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Check out failed');
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-xl"></div>;
  }

  // If user is not linked to an employee record, don't show the widget
  if (!employee) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <Clock className="h-10 w-10 text-blue-300 mb-3" />
        <h3 className="text-blue-900 font-medium">Self-Service Attendance Unavailable</h3>
        <p className="text-blue-700 text-sm mt-1">Your account is not linked to an employee profile.</p>
      </div>
    );
  }

  const isCheckedIn = !!todayRecord?.check_in;
  const isCheckedOut = !!todayRecord?.check_out;

  return (
    <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-xl font-bold text-gray-900">Time Clock</h3>
          <p className="text-gray-500 mt-1">Welcome back, {employee.first_name}</p>
          <div className="mt-4 text-3xl font-mono text-blue-600 font-semibold">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full md:w-auto">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              className="w-full md:w-48 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg shadow-md transition-colors"
            >
              Check In
            </button>
          ) : isCheckedOut ? (
            <div className="w-full md:w-48 py-4 bg-gray-100 text-gray-600 rounded-lg font-bold text-lg text-center border border-gray-200">
              Checked Out
              <div className="text-xs font-normal mt-1 text-gray-500">
                {todayRecord.working_hours} hours logged
              </div>
            </div>
          ) : (
            <button
              onClick={handleCheckOut}
              className="w-full md:w-48 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-lg shadow-md transition-colors"
            >
              Check Out
            </button>
          )}

          <div className="text-sm text-gray-500">
            {isCheckedIn && <span>In: {new Date(todayRecord.check_in!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            {isCheckedOut && <span className="ml-2">Out: {new Date(todayRecord.check_out!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
