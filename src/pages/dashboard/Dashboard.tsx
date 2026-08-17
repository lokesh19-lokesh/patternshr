import React from 'react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { company, role } = useTenant();

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to {company?.name}</h2>
            <p className="text-gray-600 mb-6">
              You are logged in as a <strong>{role?.name}</strong>. From here you can manage HR operations based on your permissions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center h-32">
                 <span className="text-gray-400 font-medium">Employees Module</span>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center h-32">
                 <span className="text-gray-400 font-medium">Attendance Module</span>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center h-32">
                 <span className="text-gray-400 font-medium">Payroll Module</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
