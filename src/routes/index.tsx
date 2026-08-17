import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { SignUp } from '../pages/auth/SignUp';
import { Onboarding } from '../pages/auth/Onboarding';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { TenantProvider } from '../lib/auth/TenantProvider';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Protected routes wrapped in TenantProvider */}
      <Route
        path="/onboarding"
        element={
          <TenantProvider>
            <ProtectedRoute requireTenant={false}>
              <Onboarding />
            </ProtectedRoute>
          </TenantProvider>
        }
      />
      
      <Route
        path="/dashboard/*"
        element={
          <TenantProvider>
            <ProtectedRoute requireTenant={true}>
              <Dashboard />
            </ProtectedRoute>
          </TenantProvider>
        }
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
