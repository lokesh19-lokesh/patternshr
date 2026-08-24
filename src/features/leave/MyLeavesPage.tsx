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

import { useNavigate } from 'react-router-dom';
import { Settings, Edit2, Check, X } from 'lucide-react';

export const MyLeavesPage: React.FC = () => {
  const { user } = useAuth();
  const { company, role } = useTenant();
  const navigate = useNavigate();

  const isPrivileged = role?.name?.toLowerCase().includes('admin') || role?.name?.toLowerCase().includes('hr') || role?.name?.toLowerCase().includes('owner');
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Admin Quick Edit Quota State
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [editingQuotaValue, setEditingQuotaValue] = useState<number>(0);
  const [savingQuota, setSavingQuota] = useState(false);

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
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const currentYear = new Date().getFullYear();

  const loadData = async (isBackground = false) => {
    if (!company || !user) return;
    try {
      if (!isBackground) setLoading(true);
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
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!company) return;

    const unsubscribe = leaveService.subscribeToLeaveUpdates(company.id, () => {
      loadData(true);
    });

    return () => {
      unsubscribe();
    };
  }, [company, user]);

  const handleSaveQuota = async (balanceId: string) => {
    if (editingQuotaValue < 0) return;
    try {
      setSavingQuota(true);
      await leaveService.updateLeaveBalance(balanceId, editingQuotaValue);
      setEditingBalanceId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update leave quota.');
    } finally {
      setSavingQuota(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">My Leaves</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-text-grey">View leave balances and request time off.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {isPrivileged && (
            <button
              onClick={() => navigate('/dashboard/leave/policies')}
              className="inline-flex items-center justify-center space-x-1.5 bg-light-grey hover:bg-soft-green text-charcoal hover:text-dark-green border border-gray-200/80 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all"
            >
              <Settings className="h-4 w-4 text-primary-green" />
              <span>Leave Policies</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center bg-primary-green hover:bg-deep-green active:scale-98 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
          >
            {showForm ? 'Cancel Request' : 'Request Time Off'}
          </button>
        </div>
      </div>

      {/* Balances Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {balances.length === 0 ? (
          <div className="col-span-full bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 text-center text-text-grey text-sm">
            No leave balances configured for {currentYear}.
          </div>
        ) : (
          balances.map((balance) => {
            const isEditing = editingBalanceId === balance.id;

            return (
              <div key={balance.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 border border-gray-200/80 relative">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-charcoal">{balance.leave_types?.name}</h3>
                  <div className="flex items-center space-x-2">
                    {balance.leave_types?.is_paid ? (
                      <span className="bg-soft-green text-dark-green border border-primary-green/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        Paid
                      </span>
                    ) : (
                      <span className="bg-light-grey text-text-grey border border-gray-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        Unpaid
                      </span>
                    )}
                    {isPrivileged && !isEditing && (
                      <button
                        onClick={() => {
                          setEditingBalanceId(balance.id);
                          setEditingQuotaValue(balance.allocated);
                        }}
                        title="Adjust Allocated Quota"
                        className="p-1 hover:bg-light-grey rounded-md text-text-grey hover:text-dark-green transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="pt-2 bg-light-grey/60 p-3 rounded-xl border border-primary-green/20 space-y-2">
                    <label className="block text-[11px] font-bold uppercase text-charcoal">
                      Set Total Quota (Days)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={editingQuotaValue}
                        onChange={(e) => setEditingQuotaValue(parseInt(e.target.value) || 0)}
                        className="block w-24 rounded-lg border border-gray-300 px-2.5 py-1 text-sm font-bold text-charcoal focus:border-primary-green focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveQuota(balance.id)}
                        disabled={savingQuota}
                        className="p-1.5 bg-primary-green hover:bg-deep-green text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingBalanceId(null)}
                        className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end justify-between pt-2">
                    <div>
                      <p className="text-3xl font-extrabold text-primary-green">{balance.remaining}</p>
                      <p className="text-xs text-text-grey font-medium mt-0.5">Days Remaining</p>
                    </div>
                    <div className="text-right text-xs text-text-grey space-y-0.5">
                      <p>Allocated: <span className="font-semibold text-charcoal">{balance.allocated}</span></p>
                      <p>Used: <span className="font-semibold text-charcoal">{balance.used}</span></p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-gray-200/80">
          <h3 className="text-base sm:text-lg font-bold text-charcoal mb-4">New Leave Request</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  Leave Type
                </label>
                <select
                  {...register('leave_type_id')}
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs bg-white"
                >
                  <option value="">Select a Leave Type</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.leave_type_id && <p className="mt-1 text-xs text-red-600">{errors.leave_type_id.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                />
                {errors.start_date && <p className="mt-1 text-xs text-red-600">{errors.start_date.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  {...register('end_date')}
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                />
                {errors.end_date && <p className="mt-1 text-xs text-red-600">{errors.end_date.message}</p>}
              </div>

              {startDate && endDate && (
                <div className="md:col-span-2 bg-soft-green p-3.5 rounded-xl text-dark-green border border-primary-green/30 text-xs sm:text-sm font-semibold">
                  Requested duration: <span className="font-extrabold text-primary-green">{calculateDays(startDate, endDate)} days</span>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                  Reason
                </label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                  placeholder="Please provide a brief reason for your leave request..."
                />
                {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-green hover:bg-deep-green active:scale-98 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-charcoal">Request History</h3>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-text-grey text-sm">
            You have no leave requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-light-grey">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-light-grey/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-charcoal">
                      {req.leave_types?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-grey">
                      {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-charcoal">
                      {req.number_of_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          req.status === 'approved'
                            ? 'bg-soft-green text-dark-green border border-primary-green/30'
                            : req.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs sm:text-sm text-text-grey max-w-xs truncate">
                      {req.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
