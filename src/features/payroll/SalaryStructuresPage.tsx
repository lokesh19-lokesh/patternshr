import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTenant } from '../../lib/auth/TenantProvider';
import { payrollService } from '../../services/payroll.service';
import { employeeService } from '../../services/employee.service';
import type { SalaryStructure } from '../../services/payroll.service';
import type { Employee } from '../../services/employee.service';

const structureSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});
type StructureForm = z.infer<typeof structureSchema>;

const assignmentSchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  salary_structure_id: z.string().min(1, 'Structure is required'),
  base_salary: z.coerce.number().min(1, 'Base salary is required'),
  effective_date: z.string().min(1, 'Effective date is required'),
});
type AssignmentForm = z.infer<typeof assignmentSchema>;

export const SalaryStructuresPage: React.FC = () => {
  const { company } = useTenant();
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'structures' | 'assignments'>('structures');
  const [showStructureForm, setShowStructureForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const structForm = useForm<StructureForm>({ resolver: zodResolver(structureSchema) as any });
  const assignForm = useForm<AssignmentForm>({ 
    resolver: zodResolver(assignmentSchema) as any,
    defaultValues: { effective_date: new Date().toISOString().split('T')[0] }
  });

  const loadData = async () => {
    if (!company) return;
    try {
      const [strData, empData, asnData] = await Promise.all([
        payrollService.getSalaryStructures(company.id),
        employeeService.getEmployees(company.id),
        payrollService.getEmployeeStructures(company.id)
      ]);
      setStructures(strData);
      setEmployees(empData);
      setAssignments(asnData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [company]);

  const onSubmitStructure = async (data: StructureForm) => {
    if (!company) return;
    try {
      await payrollService.createSalaryStructure(company.id, data);
      structForm.reset();
      setShowStructureForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to create structure');
    }
  };

  const onSubmitAssignment = async (data: AssignmentForm) => {
    if (!company) return;
    try {
      await payrollService.assignStructureToEmployee(company.id, data);
      assignForm.reset();
      setShowAssignForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign structure (Employee may already have one)');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salary Structures</h2>
          <p className="mt-1 text-sm text-gray-500">Manage pay structures and assign them to employees.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('structures')}
            className={`${activeTab === 'structures' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Structures
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`${activeTab === 'assignments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Employee Assignments
          </button>
        </nav>
      </div>

      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowStructureForm(!showStructureForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm">
              {showStructureForm ? 'Cancel' : 'Add Structure'}
            </button>
          </div>
          
          {showStructureForm && (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <form onSubmit={structForm.handleSubmit(onSubmitStructure)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Structure Name</label>
                  <input type="text" {...structForm.register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g. Executive Package" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input type="text" {...structForm.register('description')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={structForm.formState.isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Save Structure</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {structures.map((st) => (
                    <tr key={st.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{st.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{st.description}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAssignForm(!showAssignForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm">
              {showAssignForm ? 'Cancel' : 'Assign Employee'}
            </button>
          </div>
          
          {showAssignForm && (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <form onSubmit={assignForm.handleSubmit(onSubmitAssignment)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee</label>
                    <select {...assignForm.register('employee_id')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      <option value="">Select...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Structure</label>
                    <select {...assignForm.register('salary_structure_id')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      <option value="">Select...</option>
                      {structures.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Annual Base Salary</label>
                    <input type="number" {...assignForm.register('base_salary')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                    <input type="date" {...assignForm.register('effective_date')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={assignForm.formState.isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Save Assignment</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Structure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((asn) => (
                    <tr key={asn.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asn.employee?.first_name} {asn.employee?.last_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asn.structure?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${asn.base_salary.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(asn.effective_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};
