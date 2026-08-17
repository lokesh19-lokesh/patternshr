import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTenant } from '../../lib/auth/TenantProvider';
import { leaveService } from '../../services/leave.service';
import type { LeaveType, LeavePolicy } from '../../services/leave.service';

const leavePolicySchema = z.object({
  leave_type_id: z.string().min(1, 'Please select a leave type'),
  allocated_days: z.coerce.number().min(0, 'Must be 0 or positive'),
  carry_forward: z.boolean().default(false),
  max_carry_forward: z.coerce.number().optional(),
});

type LeavePolicyForm = z.infer<typeof leavePolicySchema>;

export const LeavePoliciesPage: React.FC = () => {
  const { company } = useTenant();
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<LeavePolicyForm>({
    resolver: zodResolver(leavePolicySchema) as any,
    defaultValues: { carry_forward: false, allocated_days: 0 }
  });

  const carryForward = watch('carry_forward');

  const loadData = async () => {
    if (!company) return;
    try {
      setLoading(true);
      const [fetchedTypes, fetchedPolicies] = await Promise.all([
        leaveService.getLeaveTypes(company.id),
        leaveService.getLeavePolicies(company.id)
      ]);
      setTypes(fetchedTypes);
      setPolicies(fetchedPolicies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const onSubmit = async (data: LeavePolicyForm) => {
    if (!company) return;
    try {
      await leaveService.createLeavePolicy(company.id, {
        ...data,
        max_carry_forward: data.carry_forward ? data.max_carry_forward : null
      });
      reset();
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to create leave policy');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Policies</h2>
          <p className="mt-1 text-sm text-gray-500">Define allocation rules for leave types.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
        >
          {showForm ? 'Cancel' : 'Add Policy'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
                <label className="block text-sm font-medium text-gray-700">Allocated Days per Year</label>
                <input
                  type="number"
                  {...register('allocated_days')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.allocated_days && <p className="mt-1 text-sm text-red-600">{errors.allocated_days.message}</p>}
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  {...register('carry_forward')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Allow Carry Forward to Next Year
                </label>
              </div>

              {carryForward && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Carry Forward Days</label>
                  <input
                    type="number"
                    {...register('max_carry_forward')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Policy'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No leave policies defined.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carry Forward</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.map((policy) => (
                <tr key={policy.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {policy.leave_types?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.allocated_days} days/year
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.carry_forward ? `Yes (Max: ${policy.max_carry_forward || 'Unlimited'})` : 'No'}
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
