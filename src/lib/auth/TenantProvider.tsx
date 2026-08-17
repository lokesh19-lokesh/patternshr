import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { tenantService } from '../../services/tenant.service';
import type { Company, Role } from '../../services/tenant.service';

interface TenantContextType {
  company: Company | null;
  role: Role | null;
  permissions: string[];
  loading: boolean;
  refreshTenant: () => Promise<void>;
  hasPermission: (action: string) => boolean;
}

const TenantContext = createContext<TenantContextType>({
  company: null,
  role: null,
  permissions: [],
  loading: true,
  refreshTenant: async () => {},
  hasPermission: () => false,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading: authLoading } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTenantData = async () => {
    if (!session) {
      setCompany(null);
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await tenantService.getUserTenantData();
      if (data) {
        setCompany(data.company);
        setRole(data.role);
        setPermissions(data.permissions);
      } else {
        setCompany(null);
        setRole(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Failed to load tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchTenantData();
    }
  }, [session, authLoading]);

  const hasPermission = (action: string) => {
    if (role?.is_system_role && role.name === 'Company Admin') return true; // Admins have all permissions implicitly usually, or explicitly check. We'll grant implicitly here for safety.
    return permissions.includes(action);
  };

  return (
    <TenantContext.Provider
      value={{
        company,
        role,
        permissions,
        loading: loading || authLoading,
        refreshTenant: fetchTenantData,
        hasPermission,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
