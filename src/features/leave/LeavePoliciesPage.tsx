import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTenant } from '../../lib/auth/TenantProvider';
import { leaveService } from '../../services/leave.service';
import type { LeaveType, LeavePolicy } from '../../services/leave.service';
import { Edit2, Check, X, Plus } from 'lucide-react';

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

  // Inline editing state
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [editingDays, setEditingDays] = useState<number>(0);
  const [savingEdit, setSavingEdit] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<LeavePolicyForm>({
    resolver: zodResolver(leavePolicySchema) as any,
    defaultValues: { carry_forward: false, allocated_days: 12 }
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
      await leaveService.updateCompanyLeaveQuota(company.id, data.leave_type_id, data.allocated_days);
      reset();
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save leave policy');
    }
  };

  const handleInlineSave = async (policy: LeavePolicy) => {
    if (!company) return;
    try {
      setSavingEdit(true);
      await leaveService.updateCompanyLeaveQuota(company.id, policy.leave_type_id, editingDays);
      setEditingPolicyId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update policy quota');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight">Leave Policies</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-text-grey">
            Configure dynamic annual quotas. Updating a policy immediately syncs all employee balances.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center space-x-1.5 bg-primary-green hover:bg-deep-green active:scale-98 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all self-start sm:self-auto"
        >
          {showForm ? (
            <span>Cancel</span>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add / Set Policy</span>
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-gray-200/80">
          <h3 className="text-base font-bold text-charcoal mb-4">Create or Update Policy</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
                  Allocated Days per Year
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('allocated_days')}
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                  placeholder="e.g. 15"
                />
                {errors.allocated_days && <p className="mt-1 text-xs text-red-600">{errors.allocated_days.message}</p>}
              </div>

              <div className="flex items-center mt-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="carry_forward"
                  {...register('carry_forward')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-green focus:ring-primary-green"
                />
                <label htmlFor="carry_forward" className="ml-2 block text-xs sm:text-sm font-semibold text-charcoal">
                  Allow Carry Forward to Next Year
                </label>
              </div>

              {carryForward && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
                    Max Carry Forward Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('max_carry_forward')}
                    className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-charcoal text-sm focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green shadow-xs"
                    placeholder="e.g. 5"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-green hover:bg-deep-green active:scale-98 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save & Sync Quota'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policies Table */}
      <div className="bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-charcoal">Active Leave Policies</h3>
          <span className="text-xs text-text-grey">Click the edit icon to adjust any quota</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-grey text-sm">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="p-8 text-center text-text-grey text-sm">No leave policies defined.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-light-grey">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Allocated Days</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Carry Forward</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-text-grey uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {policies.map((policy) => {
                  const isEditing = editingPolicyId === policy.id;

                  return (
                    <tr key={policy.id} className="hover:bg-light-grey/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-charcoal">
                        {policy.leave_types?.name || 'Leave Policy'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={editingDays}
                              onChange={(e) => setEditingDays(parseInt(e.target.value) || 0)}
                              className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm font-bold text-charcoal focus:border-primary-green focus:outline-none"
                            />
                            <span className="text-xs text-text-grey">days/yr</span>
                            <button
                              onClick={() => handleInlineSave(policy)}
                              disabled={savingEdit}
                              className="p-1 bg-primary-green hover:bg-deep-green text-white rounded-md transition-colors"
                              title="Save"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPolicyId(null)}
                              className="p-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-soft-green text-dark-green border border-primary-green/20">
                            {policy.allocated_days} days / year
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-grey">
                        {policy.carry_forward ? `Yes (Max: ${policy.max_carry_forward || 'Unlimited'})` : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingPolicyId(policy.id);
                              setEditingDays(policy.allocated_days);
                            }}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-primary-green hover:text-deep-green hover:bg-soft-green px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
