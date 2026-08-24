import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { Mail, Edit, Trash2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export const EmployeeList: React.FC = () => {
  const { company } = useTenant();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSendInvite = async (employee: Employee) => {
    if (!employee.email) {
      setFeedback({ type: 'error', message: 'Employee does not have an email address configured.' });
      return;
    }
    try {
      setInvitingId(employee.id);
      setFeedback(null);
      await employeeService.sendInvite(employee.email);
      setFeedback({ type: 'success', message: `Invitation link successfully sent to ${employee.email}` });
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Failed to send invitation email.' });
    } finally {
      setInvitingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!company || !deletingEmployee) return;
    try {
      setIsDeleting(true);
      setFeedback(null);
      await employeeService.deleteEmployee(company.id, deletingEmployee.id);
      setFeedback({ type: 'success', message: `Employee "${deletingEmployee.first_name} ${deletingEmployee.last_name}" has been deleted.` });
      setDeletingEmployee(null);
      await loadEmployees(true);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Failed to delete employee.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const loadEmployees = async (isBackground = false) => {
    if (!company) return;
    try {
      if (!isBackground) setLoading(true);
      const data = await employeeService.getEmployees(company.id);
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();

    if (!company) return;

    const unsubscribe = employeeService.subscribeToEmployees(company.id, () => {
      loadEmployees(true);
    });

    return () => {
      unsubscribe();
    };
  }, [company]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-sm text-gray-500 mt-1">Manage team members, send access invitations, and update designations.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/employees/new')}
          className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading employees...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp ID</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No employees found. Click "Add Employee" to create your first team member.
                    </td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                              {emp.first_name?.[0] || ''}{emp.last_name?.[0] || ''}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{emp.first_name} {emp.last_name}</div>
                            <div className="text-xs text-gray-500">{emp.email || 'No email provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{emp.employee_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.department?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.designation?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {emp.email && (
                          <button
                            onClick={() => handleSendInvite(emp)}
                            disabled={invitingId === emp.id}
                            className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
                            title="Send login invitation link to email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>{invitingId === emp.id ? 'Sending...' : 'Send Invite'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/dashboard/employees/${emp.id}/edit`)}
                          className="inline-flex items-center space-x-1 text-xs text-gray-700 hover:text-gray-900 font-semibold bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition-colors"
                          title="Edit employee details"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingEmployee(emp)}
                          className="inline-flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 font-semibold bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition-colors"
                          title="Delete employee record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Employee Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-full text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Employee</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-gray-900">
                {deletingEmployee.first_name} {deletingEmployee.last_name}
              </strong>{' '}
              ({deletingEmployee.employee_id})? All associated attendance logs, leave balances, and payroll records for this employee will be deleted.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 flex items-center space-x-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Employee'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
