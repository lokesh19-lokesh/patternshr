import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenant?: boolean;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireTenant = true,
  allowedRoles
}) => {
  const { session, loading: authLoading } = useAuth();
  const { company, role, loading: tenantLoading } = useTenant();
  const location = useLocation();

  if (authLoading || tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated -> Login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated, but requires tenant and user has none -> Onboarding
  if (requireTenant && !company) {
    return <Navigate to="/onboarding" replace />;
  }

  // Role checking
  if (allowedRoles && allowedRoles.length > 0 && role) {
    const normalizedUserRole = role.name.toLowerCase();
    
    // Map system roles to our normalized string array format
    const roleMapping: Record<string, string[]> = {
      'company admin': ['owner', 'admin'],
      'hr manager': ['hr', 'manager'],
      'department manager': ['manager'],
      'employee': ['employee']
    };
    
    const userRoleKeys = roleMapping[normalizedUserRole] || [];
    const hasRoleAccess = allowedRoles.some(allowedRole => userRoleKeys.includes(allowedRole.toLowerCase()));
    
    if (!hasRoleAccess) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="rounded-full bg-red-100 p-4 mb-4">
            <ShieldAlert className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 text-center max-w-md mb-6">
            You do not have the required permissions to view this page. If you believe this is an error, please contact your Company Administrator.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            Go Back
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
