import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTenant } from '../../lib/auth/TenantProvider';
import { payrollService } from '../../services/payroll.service';
import type { SalaryComponent } from '../../services/payroll.service';

const componentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['earning', 'deduction']),
  is_percentage: z.boolean().default(false),
  percentage_value: z.coerce.number().optional(),
});

type ComponentForm = z.infer<typeof componentSchema>;

export const SalaryComponentsPage: React.FC = () => {
  const { company } = useTenant();
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ComponentForm>({
    resolver: zodResolver(componentSchema) as any,
    defaultValues: { type: 'earning', is_percentage: false }
  });

  const isPercentage = watch('is_percentage');

  const loadData = async () => {
    if (!company) return;
    try {
      setLoading(true);
      const data = await payrollService.getSalaryComponents(company.id);
      setComponents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const onSubmit = async (data: ComponentForm) => {
    if (!company) return;
    try {
      await payrollService.createSalaryComponent(company.id, {
        ...data,
        percentage_value: data.percentage_value || null,
      });
      reset();
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to create salary component');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salary Components</h2>
          <p className="mt-1 text-sm text-gray-500">Configure global earnings and deductions.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
        >
          {showForm ? 'Cancel' : 'Add Component'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Component Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g. House Rent Allowance, PF"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                </select>
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  {...register('is_percentage')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Calculate as percentage of Base Salary
                </label>
              </div>

              {isPercentage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Percentage Value (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('percentage_value')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g. 10.5"
                  />
                </div>
              )}
              {!isPercentage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fixed Amount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('percentage_value')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g. 500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank if this varies per employee.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Component'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading components...</div>
        ) : components.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No salary components found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation Rule</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {components.map((comp) => (
                <tr key={comp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {comp.type === 'earning' ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Earning</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">Deduction</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comp.is_percentage 
                      ? `${comp.percentage_value}% of Base Salary` 
                      : comp.percentage_value ? `Fixed: $${comp.percentage_value}` : 'Variable'}
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
