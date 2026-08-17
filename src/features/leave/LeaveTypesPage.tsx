import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTenant } from '../../lib/auth/TenantProvider';
import { leaveService } from '../../services/leave.service';
import type { LeaveType } from '../../services/leave.service';

const leaveTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  is_paid: z.boolean().default(true),
});

type LeaveTypeForm = z.infer<typeof leaveTypeSchema>;

export const LeaveTypesPage: React.FC = () => {
  const { company } = useTenant();
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LeaveTypeForm>({
    resolver: zodResolver(leaveTypeSchema) as any,
    defaultValues: { is_paid: true }
  });

  const loadTypes = async () => {
    if (!company) return;
    try {
      setLoading(true);
      const data = await leaveService.getLeaveTypes(company.id);
      setTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, [company]);

  const onSubmit = async (data: LeaveTypeForm) => {
    if (!company) return;
    try {
      await leaveService.createLeaveType(company.id, data);
      reset();
      setShowForm(false);
      loadTypes();
    } catch (err) {
      console.error(err);
      alert('Failed to create leave type');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Types</h2>
          <p className="mt-1 text-sm text-gray-500">Configure categories for employee time off.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
        >
          {showForm ? 'Cancel' : 'Add Leave Type'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g. Annual Leave, Sick Leave"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <input
                  type="text"
                  {...register('description')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2 flex items-center mt-2">
                <input
                  type="checkbox"
                  {...register('is_paid')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  This is a paid leave type
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Leave Type'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading leave types...</div>
        ) : types.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No leave types found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {types.map((type) => (
                <tr key={type.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{type.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {type.is_paid ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Paid</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">Unpaid</span>
                    )}
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
