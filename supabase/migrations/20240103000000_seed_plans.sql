-- Insert Default Subscription Plans
INSERT INTO public.subscription_plans (id, name, description, employee_limit, features, price_monthly, price_yearly)
VALUES 
    (uuid_generate_v4(), 'Starter', 'Perfect for small teams and startups.', 10, '["Core HR", "Leave Management", "Attendance Tracking"]', 29.00, 290.00),
    (uuid_generate_v4(), 'Professional', 'Advanced features for growing businesses.', 50, '["Everything in Starter", "Payroll Processing", "Work Reports", "Basic Analytics"]', 99.00, 990.00),
    (uuid_generate_v4(), 'Enterprise', 'Full suite with unlimited capabilities.', 999999, '["Everything in Professional", "Custom Reports", "Priority Support", "Dedicated Account Manager"]', 299.00, 2990.00);
