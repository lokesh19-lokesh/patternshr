import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlobalErrorBoundary } from '../../components/layout/ErrorBoundary';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { Menu, LogOut } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <nav className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Left Branding & Mobile Toggle */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition-colors"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">PatternSHR</span>
                  <span className="hidden sm:inline-block text-gray-300">|</span>
                  <span className="hidden sm:inline-block text-xs sm:text-sm font-semibold text-gray-600 truncate max-w-[160px] md:max-w-[220px]">
                    {company?.name}
                  </span>
                </div>
              </div>

              {/* Right User & Notification Controls */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="hidden md:inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 px-2.5 py-0.5 text-xs font-semibold">
                  {role?.name || 'User'}
                </span>
                
                <NotificationBell />
                
                <span className="hidden sm:inline-block text-xs md:text-sm text-gray-600 font-medium truncate max-w-[140px] md:max-w-[200px]">
                  {user?.email}
                </span>

                <button
                  onClick={signOut}
                  className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Sign out</span>
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
