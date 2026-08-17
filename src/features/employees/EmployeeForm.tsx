import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Department, Designation, Employee } from '../../services/employee.service';

const employeeSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  department_id: z.string().uuid('Please select a department').optional().or(z.literal('')),
  designation_id: z.string().uuid('Please select a designation').optional().or(z.literal('')),
  manager_id: z.string().uuid('Please select a manager').optional().or(z.literal('')),
  joining_date: z.string().min(1, 'Joining date is required'),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  employment_type: z.string().optional().or(z.literal('')),
  address_text: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const EmployeeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const { company } = useTenant();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      department_id: '',
      designation_id: '',
      manager_id: '',
      gender: '',
      employment_type: '',
      phone: '',
      date_of_birth: ''
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
        const [depts, desigs, emps] = await Promise.all([
          employeeService.getDepartments(company.id),
          employeeService.getDesignations(company.id),
          employeeService.getEmployees(company.id)
        ]);
        setDepartments(depts);
        setDesignations(desigs);
        
        // Filter out current employee from managers list if editing
        setEmployees(emps.filter(e => !isEditMode || e.id !== id));
        
        if (isEditMode && id) {
          const emp = await employeeService.getEmployeeById(company.id, id);
          if (emp) {
            reset({
              employee_id: emp.employee_id,
              first_name: emp.first_name,
              last_name: emp.last_name,
              email: emp.email,
              phone: emp.phone || '',
              department_id: emp.department_id || '',
              designation_id: emp.designation_id || '',
              manager_id: emp.manager_id || '',
              joining_date: emp.joining_date,
              date_of_birth: emp.date_of_birth || '',
              gender: emp.gender || '',
              employment_type: emp.employment_type || '',
              address_text: emp.address?.text || '',
              emergency_contact_name: emp.emergency_contact?.name || '',
              emergency_contact_phone: emp.emergency_contact?.phone || '',
              emergency_contact_relation: emp.emergency_contact?.relation || ''
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFormData();
  }, [company, id, isEditMode, reset]);

  const onSubmit = async (data: EmployeeFormValues) => {
    if (!company) return;
    try {
      const payload = {
        employee_id: data.employee_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        department_id: data.department_id || null,
        designation_id: data.designation_id || null,
        manager_id: data.manager_id || null,
        joining_date: data.joining_date,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        employment_type: data.employment_type || null,
        address: data.address_text ? { text: data.address_text } : null,
        emergency_contact: (data.emergency_contact_name || data.emergency_contact_phone) ? {
          name: data.emergency_contact_name || '',
          phone: data.emergency_contact_phone || '',
          relation: data.emergency_contact_relation || ''
        } : null
      };
      
      if (isEditMode && id) {
        await employeeService.updateEmployee(company.id, id, payload);
      } else {
        await employeeService.createEmployee(company.id, payload);
      }
      navigate('/dashboard/employees');
    } catch (err: any) {
      console.error('Failed to save employee', err);
      alert(err.message || 'Failed to save employee');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading form...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h2>
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
                <input type="email" {...register('email')} disabled={isEditMode} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="text" {...register('phone')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" {...register('date_of_birth')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select {...register('gender')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">Employment Details</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input type="text" {...register('employee_id')} disabled={isEditMode} placeholder="EMP-001" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100" />
                {errors.employee_id && <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <input type="date" {...register('joining_date')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
                {errors.joining_date && <p className="mt-1 text-sm text-red-600">{errors.joining_date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                <select {...register('employment_type')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Select Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Manager</label>
                <select {...register('manager_id')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Select Manager</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>)}
                </select>
                {errors.manager_id && <p className="mt-1 text-sm text-red-600">{errors.manager_id.message}</p>}
              </div>
            </div>
          </div>

          {/* Address & Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">Address & Emergency Contact</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Full Address</label>
                <textarea rows={3} {...register('address_text')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                <input type="text" {...register('emergency_contact_name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                <input type="text" {...register('emergency_contact_phone')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relation</label>
                <input type="text" {...register('emergency_contact_relation')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Employee' : 'Save Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
