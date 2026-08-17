import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../lib/auth/TenantProvider';
import { tenantService } from '../../services/tenant.service';
import { useAuth } from '../../lib/auth/AuthProvider';

const onboardingSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export const Onboarding: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { company, refreshTenant, loading: tenantLoading } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
  });

  // Redirect if already has a company
  useEffect(() => {
    if (!tenantLoading && company) {
      navigate('/dashboard', { replace: true });
    }
  }, [company, tenantLoading, navigate]);

  const onSubmit = async (data: OnboardingForm) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await tenantService.createCompanyWithAdmin(data.companyName);
      await refreshTenant();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create company. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Welcome to PatternSHR
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let's set up your company workspace to get started.
          </p>
          <div className="mt-4 text-center text-xs text-gray-500">
            Logged in as: {user?.email}
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                {...register('companyName')}
                placeholder="e.g. Acme Corporation"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {isSubmitting ? 'Creating workspace...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
