import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../lib/auth/TenantProvider';
import { employeeService } from '../../services/employee.service';
import type { Employee } from '../../services/employee.service';
import { Mail, Edit, Trash2, UserPlus, AlertCircle, CheckCircle, Users, Building2, Briefcase } from 'lucide-react';

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-green" />
            <span>Employees</span>
          </h2>
          <p className="text-xs sm:text-sm text-text-grey mt-0.5">
            Manage team members, send access invitations, and update designations.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/employees/new')}
          className="inline-flex items-center justify-center space-x-2 bg-primary-green hover:bg-deep-green active:scale-98 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            feedback.type === 'success' ? 'bg-soft-green border-primary-green/30 text-dark-green' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-primary-green flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-grey text-sm">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-text-grey text-sm">
            No employees found. Click "Add Employee" to create your first team member.
          </div>
        ) : (
          <>
            {/* Mobile View: High-density responsive cards */}
            <div className="block md:hidden divide-y divide-gray-100">
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 space-y-3 hover:bg-light-grey/40 transition-colors">
                  {/* Top: Avatar, Name, Email, and Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-soft-green text-dark-green font-bold flex items-center justify-center text-sm border border-primary-green/30">
                        {emp.first_name?.[0] || ''}{emp.last_name?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-charcoal truncate">
                          {emp.first_name} {emp.last_name}
                        </h4>
                        <p className="text-xs text-text-grey truncate">
                          {emp.email || 'No email provided'}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-soft-green text-dark-green border border-primary-green/30 flex-shrink-0">
                      {emp.status || 'Active'}
                    </span>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-1.5 text-xs text-text-grey">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-light-grey text-charcoal font-mono font-semibold text-[11px] border border-gray-200">
                      {emp.employee_id || 'ID Pending'}
                    </span>
                    {emp.department?.name && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-light-grey text-text-grey text-[11px] border border-gray-200">
                        <Building2 className="h-3 w-3 text-primary-green" />
                        <span>{emp.department.name}</span>
                      </span>
                    )}
                    {emp.designation?.name && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-light-grey text-text-grey text-[11px] border border-gray-200">
                        <Briefcase className="h-3 w-3 text-primary-green" />
                        <span>{emp.designation.name}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    {emp.email && (
                      <button
                        onClick={() => handleSendInvite(emp)}
                        disabled={invitingId === emp.id}
                        className="inline-flex items-center space-x-1 text-xs text-dark-green font-semibold bg-soft-green hover:bg-primary-green hover:text-white px-2.5 py-1.5 rounded-lg border border-primary-green/20 transition-all disabled:opacity-50"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>{invitingId === emp.id ? 'Sending...' : 'Invite'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/dashboard/employees/${emp.id}/edit`)}
                      className="inline-flex items-center space-x-1 text-xs text-charcoal hover:text-dark-green font-semibold bg-light-grey hover:bg-soft-green px-2.5 py-1.5 rounded-lg border border-gray-200 transition-all"
                    >
                      <Edit className="h-3.5 w-3.5 text-text-grey" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingEmployee(emp)}
                      className="inline-flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 font-semibold bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Data Table with horizontal scroll */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-light-grey">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Emp ID</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-text-grey uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-text-grey uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-light-grey/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-soft-green text-dark-green border border-primary-green/30 flex items-center justify-center font-bold text-sm">
                              {emp.first_name?.[0] || ''}{emp.last_name?.[0] || ''}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-charcoal">{emp.first_name} {emp.last_name}</div>
                            <div className="text-xs text-text-grey">{emp.email || 'No email provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal font-mono font-medium">{emp.employee_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-grey">{emp.department?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-grey">{emp.designation?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-soft-green border border-primary-green/30 px-2.5 py-0.5 text-xs font-semibold text-dark-green">
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {emp.email && (
                          <button
                            onClick={() => handleSendInvite(emp)}
                            disabled={invitingId === emp.id}
                            className="inline-flex items-center space-x-1 text-xs text-dark-green font-semibold bg-soft-green hover:bg-primary-green hover:text-white px-2.5 py-1.5 rounded-lg border border-primary-green/20 transition-all disabled:opacity-50"
                            title="Send login invitation link to email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>{invitingId === emp.id ? 'Sending...' : 'Send Invite'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/dashboard/employees/${emp.id}/edit`)}
                          className="inline-flex items-center space-x-1 text-xs text-charcoal hover:text-dark-green font-semibold bg-light-grey hover:bg-soft-green px-2.5 py-1.5 rounded-lg border border-gray-200 transition-all"
                          title="Edit employee details"
                        >
                          <Edit className="h-3.5 w-3.5 text-text-grey" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingEmployee(emp)}
                          className="inline-flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 font-semibold bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition-all"
                          title="Delete employee record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Employee Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-full text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal">Delete Employee</h3>
                <p className="text-xs text-text-grey">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-text-grey mb-6 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-charcoal">
                {deletingEmployee.first_name} {deletingEmployee.last_name}
              </strong>{' '}
              ({deletingEmployee.employee_id})? All associated attendance logs, leave balances, and payroll records for this employee will be deleted.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-charcoal bg-white border border-gray-300 rounded-xl hover:bg-light-grey transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:bg-red-300 flex items-center space-x-1.5 shadow-sm"
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

