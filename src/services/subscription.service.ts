import { supabase } from '../lib/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  employee_limit: number;
  features: string[];
  price_monthly: number;
  price_yearly: number;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string; // 'trialing', 'active', 'canceled', 'past_due'
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlan;
}

export const subscriptionService = {
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly');
    
    if (error) throw error;
    return data as SubscriptionPlan[];
  },

  async getCurrentSubscription(companyId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('company_id', companyId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
    return data as Subscription | null;
  },

  async initializeTrial(companyId: string): Promise<void> {
    // 1. Get the Starter plan ID
    const { data: starterPlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', 'Starter')
      .single();

    if (!starterPlan) return;

    // 2. Create a 14-day trial subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14);

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        company_id: companyId,
        plan_id: starterPlan.id,
        status: 'trialing',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
      });

    if (error) {
      console.error('Failed to initialize trial:', error);
    }
  },

  async upgradeSubscription(companyId: string, planId: string): Promise<void> {
    // In a real app, this would involve a Stripe Checkout Session
    // For this MVP, we simulate a successful payment and instantly activate
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 1); // 1 month billing cycle

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString()
        })
        .eq('company_id', companyId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          company_id: companyId,
          plan_id: planId,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString()
        });
      if (error) throw error;
    }
  }
};
