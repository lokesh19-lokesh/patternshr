import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsnkmjuyloueeuyxtulq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbmttanV5bG91ZWV1eXh0dWxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkzODk2NSwiZXhwIjoyMTAyNTE0OTY1fQ.BIZ9KZMyvJdMIjD7RCh2pyriMKsKBbKAXp1GYgV-bsU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function seedPlans() {
  const plans = [
    { name: 'Starter', description: 'Perfect for small teams and startups.', employee_limit: 10, features: ["Core HR", "Leave Management", "Attendance Tracking"], price_monthly: 29.00, price_yearly: 290.00 },
    { name: 'Professional', description: 'Advanced features for growing businesses.', employee_limit: 50, features: ["Everything in Starter", "Payroll Processing", "Work Reports", "Basic Analytics"], price_monthly: 99.00, price_yearly: 990.00 },
    { name: 'Enterprise', description: 'Full suite with unlimited capabilities.', employee_limit: 999999, features: ["Everything in Professional", "Custom Reports", "Priority Support", "Dedicated Account Manager"], price_monthly: 299.00, price_yearly: 2990.00 }
  ];
  
  const { error } = await supabase.from('subscription_plans').insert(plans);
  if (error) {
    console.error('Error seeding plans:', error);
  } else {
    console.log('Plans seeded successfully!');
  }
}

seedPlans();
