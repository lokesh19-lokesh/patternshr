import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Department, Designation } from '../../services/employee.service';

const employeeSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department_id: z.string().uuid('Please select a department').optional().or(z.literal('')),
  designation_id: z.string().uuid('Please select a designation').optional().or(z.literal('')),
  joining_date: z.string().min(1, 'Joining date is required'),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const EmployeeForm: React.FC = () => {
  const { company } = useTenant();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      department_id: '',
      designation_id: ''
    }
  });

  const selectedDepartmentId = watch('department_id');
  const filteredDesignations = designations.filter(d => 
    !selectedDepartmentId || d.department_id === selectedDepartmentId
  );

  useEffect(() => {
    const loadFormData = async () => {
      if (!company) return;
      try {
        const [depts, desigs] = await Promise.all([
          employeeService.getDepartments(company.id),
          employeeService.getDesignations(company.id)
        ]);
        setDepartments(depts);
        setDesignations(desigs);
      } catch (err) {
        console.error(err);
      }
    };
    loadFormData();
  }, [company]);

  const onSubmit = async (data: EmployeeFormValues) => {
    if (!company) return;
    try {
      const payload = {
        ...data,
        department_id: data.department_id || null,
        designation_id: data.designation_id || null,
      };
      await employeeService.createEmployee(company.id, payload);
      navigate('/dashboard/employees');
    } catch (err: any) {
      console.error('Failed to create employee', err);
      alert(err.message || 'Failed to create employee');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Add New Employee</h2>
        <button
          onClick={() => navigate('/dashboard/employees')}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input type="text" {...register('first_name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
                {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input type="text" {...register('last_name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
                {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" {...register('email')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="text" {...register('phone')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">Employment Details</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input type="text" {...register('employee_id')} placeholder="EMP-001" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
                {errors.employee_id && <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <input type="date" {...register('joining_date')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
                {errors.joining_date && <p className="mt-1 text-sm text-red-600">{errors.joining_date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select {...register('department_id')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.department_id && <p className="mt-1 text-sm text-red-600">{errors.department_id.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <select {...register('designation_id')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" disabled={!selectedDepartmentId && filteredDesignations.length === 0}>
                  <option value="">Select Designation</option>
                  {filteredDesignations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.designation_id && <p className="mt-1 text-sm text-red-600">{errors.designation_id.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
