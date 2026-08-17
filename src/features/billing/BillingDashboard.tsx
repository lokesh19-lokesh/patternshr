import React, { useState, useEffect } from 'react';
import { useTenant } from '../../lib/auth/TenantProvider';
import { subscriptionService } from '../../services/subscription.service';
import type { Subscription, SubscriptionPlan } from '../../services/subscription.service';
import { CreditCard, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

export const BillingDashboard: React.FC = () => {
  const { company } = useTenant();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      loadData();
    }
  }, [company]);

  const loadData = async () => {
    if (!company) return;
    try {
      setLoading(true);
      const [subData, plansData, { count }] = await Promise.all([
        subscriptionService.getCurrentSubscription(company.id),
        subscriptionService.getAvailablePlans(),
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', company.id)
      ]);
      setSubscription(subData);
      setPlans(plansData);
      setEmployeeCount(count || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!company) return;
    try {
      setProcessing(planId);
      await subscriptionService.upgradeSubscription(company.id, planId);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upgrade plan.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading billing details...</div>;

  const currentPlan = subscription?.plan;
  const isTrialing = subscription?.status === 'trialing';
  const trialEnd = new Date(subscription?.current_period_end || '');
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your plan, billing cycle, and employee limits.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Current Status Overview */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
          </div>
          {isTrialing && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              Trial Active ({daysRemaining} days left)
            </span>
          )}
          {subscription?.status === 'active' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Plan</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{currentPlan?.name || 'No Plan Active'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Employee Usage</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {employeeCount} / {currentPlan?.employee_limit === 999999 ? 'Unlimited' : currentPlan?.employee_limit || 0}
            </p>
            {currentPlan && employeeCount >= currentPlan.employee_limit && (
              <p className="text-sm text-red-600 font-medium mt-1">Limit reached. Upgrade to add more.</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Renewal Date</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Available Plans</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border-2 ${currentPlan?.id === plan.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-transparent'}`}
            >
              <div className="px-6 py-8 bg-gray-50 sm:p-10 sm:pb-6 flex-grow">
                <div>
                  <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-100 text-blue-600" id="tier-standard">
                    {plan.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                  ${plan.price_monthly}
                  <span className="ml-1 text-2xl font-medium text-gray-500">/mo</span>
                </div>
                <p className="mt-5 text-lg text-gray-500">{plan.description}</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  Up to {plan.employee_limit === 999999 ? 'Unlimited' : plan.employee_limit} employees
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-white sm:p-10 sm:pt-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-6 w-6 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <div className="rounded-lg shadow-md">
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={currentPlan?.id === plan.id || processing !== null}
                      className={`block w-full text-center rounded-lg border border-transparent px-6 py-3 text-base font-medium transition-colors
                        ${currentPlan?.id === plan.id 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
                      `}
                    >
                      {processing === plan.id ? 'Processing...' : currentPlan?.id === plan.id ? 'Current Plan' : 'Upgrade to ' + plan.name}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
