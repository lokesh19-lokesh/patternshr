import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlobalErrorBoundary } from '../../components/layout/ErrorBoundary';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';

import { EmployeeList } from '../../features/employees/EmployeeList';
import { EmployeeForm } from '../../features/employees/EmployeeForm';
import { DepartmentsPage } from '../../features/departments/DepartmentsPage';
import { DesignationsPage } from '../../features/designations/DesignationsPage';
import { DailyRoster } from '../../features/attendance/DailyRoster';
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
import { NotificationBell } from '../../features/notifications/NotificationBell';
import { ReportsDashboard } from '../../features/reports/ReportsDashboard';
import { BillingDashboard } from '../../features/billing/BillingDashboard';
import { DashboardOverview } from './DashboardOverview';

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
                
                <NotificationBell />
                
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
            <GlobalErrorBoundary>
              <Routes>
                <Route path="/" element={<DashboardOverview />} />
                <Route path="/attendance" element={<DailyRoster />} />
                
                {/* Employee Management */}
                <Route path="/employees" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><EmployeeList /></ProtectedRoute>
                } />
                <Route path="/employees/new" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><EmployeeForm /></ProtectedRoute>
                } />
                <Route path="/employees/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><EmployeeForm /></ProtectedRoute>
                } />
                <Route path="/departments" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><DepartmentsPage /></ProtectedRoute>
                } />
                <Route path="/designations" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><DesignationsPage /></ProtectedRoute>
                } />
                
                {/* Leave Management */}
                <Route path="/leave" element={<MyLeavesPage />} />
                <Route path="/leave/types" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><LeaveTypesPage /></ProtectedRoute>
                } />
                <Route path="/leave/policies" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><LeavePoliciesPage /></ProtectedRoute>
                } />
                <Route path="/leave/approvals" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><LeaveApprovalsPage /></ProtectedRoute>
                } />
                
                {/* Work Reports */}
                <Route path="/work/projects" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><ProjectsPage /></ProtectedRoute>
                } />
                <Route path="/work" element={<MyReportsPage />} />
                <Route path="/work/reviews" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><ReportReviewPage /></ProtectedRoute>
                } />
                
                {/* Payroll */}
                <Route path="/payroll/components" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><SalaryComponentsPage /></ProtectedRoute>
                } />
                <Route path="/payroll/structures" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><SalaryStructuresPage /></ProtectedRoute>
                } />
                <Route path="/payroll/processing" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><PayrollProcessingPage /></ProtectedRoute>
                } />
                <Route path="/payroll" element={<MyPayslipsPage />} />
                
                {/* Admin & Reporting */}
                <Route path="/reports" element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}><ReportsDashboard /></ProtectedRoute>
                } />
                <Route path="/billing" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner']}><BillingDashboard /></ProtectedRoute>
                } />
                <Route path="/documents/*" element={<div>Documents Module (Coming Soon)</div>} />
              </Routes>
            </GlobalErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
