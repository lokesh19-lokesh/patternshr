import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../lib/auth/TenantProvider';
import { tenantService } from '../../services/tenant.service';
import { useAuth } from '../../lib/auth/AuthProvider';
import { LogOut } from 'lucide-react';

const onboardingSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export const Onboarding: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { company, refreshTenant, loading: tenantLoading } = useTenant();
  const { user, signOut } = useAuth();
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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Top right Sign Out action */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Patterns HR"
            className="h-20 sm:h-24 w-auto max-w-[260px] mx-auto object-contain mb-4"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
            Set Up Your Workspace
          </h2>
          <p className="mt-1.5 text-center text-sm text-gray-600">
            Enter your company details to initialize your HR dashboard.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <span>Logged in as: <strong className="font-medium text-gray-700">{user?.email}</strong></span>
            <span>•</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 font-semibold hover:underline"
            >
              Log Out
            </button>
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
              <label htmlFor="companyName" className="block text-sm font-medium text-charcoal">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                {...register('companyName')}
                placeholder="e.g. Acme Corporation"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-charcoal focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green sm:text-sm"
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
              className="flex w-full justify-center rounded-md bg-primary-green hover:bg-deep-green py-2.5 px-4 text-sm font-bold text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Creating Workspace...' : 'Get Started'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
