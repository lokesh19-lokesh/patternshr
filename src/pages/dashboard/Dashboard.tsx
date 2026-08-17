import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { Sidebar } from '../../components/layout/Sidebar';

import { EmployeeList } from '../../features/employees/EmployeeList';
import { EmployeeForm } from '../../features/employees/EmployeeForm';
import { DepartmentsPage } from '../../features/departments/DepartmentsPage';
import { DesignationsPage } from '../../features/designations/DesignationsPage';
import { DailyRoster } from '../../features/attendance/DailyRoster';
import { SelfServiceWidget } from '../../features/attendance/SelfServiceWidget';
import { LeaveTypesPage } from '../../features/leave/LeaveTypesPage';
import { LeavePoliciesPage } from '../../features/leave/LeavePoliciesPage';
import { MyLeavesPage } from '../../features/leave/MyLeavesPage';
import { LeaveApprovalsPage } from '../../features/leave/LeaveApprovalsPage';
import { ProjectsPage } from '../../features/work/ProjectsPage';
import { MyReportsPage } from '../../features/work/MyReportsPage';
import { ReportReviewPage } from '../../features/work/ReportReviewPage';
import { SalaryComponentsPage } from '../../features/payroll/SalaryComponentsPage';
import { SalaryStructuresPage } from '../../features/payroll/SalaryStructuresPage';
import { PayrollProcessingPage } from '../../features/payroll/PayrollProcessingPage';
import { MyPayslipsPage } from '../../features/payroll/MyPayslipsPage';

const Overview = () => (
  <div className="space-y-6">
    <SelfServiceWidget />
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
      <p className="text-gray-600">Select an item from the sidebar to manage your company data.</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { company, role } = useTenant();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">PatternSHR</h1>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-600">{company?.name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {role?.name || 'Loading role...'}
                </span>
                <span className="text-sm text-gray-500">{user?.email}</span>
                <button
                  onClick={signOut}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/attendance" element={<DailyRoster />} />
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/employees/new" element={<EmployeeForm />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/designations" element={<DesignationsPage />} />
              <Route path="/leave" element={<MyLeavesPage />} />
              <Route path="/leave/types" element={<LeaveTypesPage />} />
              <Route path="/leave/policies" element={<LeavePoliciesPage />} />
              <Route path="/leave/approvals" element={<LeaveApprovalsPage />} />
              <Route path="/work/projects" element={<ProjectsPage />} />
              <Route path="/work" element={<MyReportsPage />} />
              <Route path="/work/reviews" element={<ReportReviewPage />} />
              <Route path="/payroll/components" element={<SalaryComponentsPage />} />
              <Route path="/payroll/structures" element={<SalaryStructuresPage />} />
              <Route path="/payroll/processing" element={<PayrollProcessingPage />} />
              <Route path="/payroll" element={<MyPayslipsPage />} />
              <Route path="/documents/*" element={<div>Documents Module (Coming Soon)</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};
