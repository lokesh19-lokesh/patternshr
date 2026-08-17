import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { leaveService } from '../../services/leave.service';
import type { LeaveType, LeaveBalance, LeaveRequest } from '../../services/leave.service';
import { AlertCircle } from 'lucide-react';

const leaveRequestSchema = z.object({
  leave_type_id: z.string().min(1, 'Please select a leave type'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Please provide a reason'),
});

type LeaveRequestForm = z.infer<typeof leaveRequestSchema>;

export const MyLeavesPage: React.FC = () => {
  const { user } = useAuth();
  const { company } = useTenant();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema)
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    
    // Simple calculation: includes weekends for this demo. 
    // In production, you'd exclude weekends/holidays based on policies.
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const currentYear = new Date().getFullYear();

  const loadData = async () => {
    if (!company || !user) return;
    try {
      setLoading(true);
      const emp = await employeeService.getCurrentEmployee(company.id, user.id);
      setEmployee(emp);

      if (emp) {
        const [fetchedTypes, fetchedBalances, fetchedRequests] = await Promise.all([
          leaveService.getLeaveTypes(company.id),
          leaveService.getEmployeeBalances(emp.id, currentYear),
          leaveService.getMyLeaveRequests(emp.id)
        ]);
        setTypes(fetchedTypes);
        setBalances(fetchedBalances);
        setRequests(fetchedRequests);
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

  const onSubmit = async (data: LeaveRequestForm) => {
    if (!company || !employee) return;
    const days = calculateDays(data.start_date, data.end_date);
    if (days <= 0) {
      alert("Invalid date range");
      return;
    }

    try {
      await leaveService.submitLeaveRequest(company.id, employee.id, {
        ...data,
        number_of_days: days
      });
      reset();
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit leave request');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your leaves...</div>;
  }

  if (!employee) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex flex-col items-center">
        <AlertCircle className="h-10 w-10 text-yellow-500 mb-2" />
        <h3 className="text-lg font-medium text-yellow-800">No Employee Profile Found</h3>
        <p className="text-yellow-700 mt-1">Your account is not linked to an employee profile. You cannot request leave.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Leaves</h2>
          <p className="mt-1 text-sm text-gray-500">View balances and request time off.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
        >
          {showForm ? 'Cancel Request' : 'Request Time Off'}
        </button>
      </div>

      {/* Balances Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {balances.length === 0 ? (
          <div className="col-span-3 bg-white p-6 rounded-lg shadow border border-gray-100 text-center text-gray-500">
            No leave balances configured for {currentYear}.
          </div>
        ) : (
          balances.map(balance => (
            <div key={balance.id} className="bg-white rounded-lg shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{balance.leave_types?.name}</h3>
                {balance.leave_types?.is_paid ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Paid</span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Unpaid</span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{balance.remaining}</p>
                  <p className="text-sm text-gray-500">Days Remaining</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Allocated: {balance.allocated}</p>
                  <p>Used: {balance.used}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">New Leave Request</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                <select
                  {...register('leave_type_id')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a Leave Type</option>
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.leave_type_id && <p className="mt-1 text-sm text-red-600">{errors.leave_type_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  {...register('end_date')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>}
              </div>

              {startDate && endDate && (
                <div className="md:col-span-2 bg-blue-50 p-3 rounded text-blue-800 text-sm">
                  Requested duration: <span className="font-bold">{calculateDays(startDate, endDate)} days</span>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Please provide a brief reason for your leave request..."
                />
                {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Request History</h3>
        </div>
        {requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">You have no leave requests.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {req.leave_types?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.number_of_days} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.status === 'pending' && <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">Pending</span>}
                    {req.status === 'approved' && <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Approved</span>}
                    {req.status === 'rejected' && <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">Rejected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
