import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTenant } from '../../lib/auth/TenantProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenant?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireTenant = true 
}) => {
  const { session, loading: authLoading } = useAuth();
  const { company, loading: tenantLoading } = useTenant();
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

  return <>{children}</>;
};
