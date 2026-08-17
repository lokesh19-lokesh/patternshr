import { Client } from 'pg';

const connectionString = 'postgresql://postgres:Tpc@12345678987654321Lo@db.dsnkmjuyloueeuyxtulq.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  
  const sql = `
    CREATE POLICY "Users can view their own companies" ON public.companies
    FOR SELECT USING (id IN (SELECT public.get_user_company_ids()));
    
    CREATE POLICY "Users can view subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);
    
    CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (company_id IN (SELECT public.get_user_company_ids()));
  `;
  
  try {
    await client.query(sql);
    console.log('Policies added!');
  } catch (err) {
    console.error('Error adding policies:', err.message);
  } finally {
    await client.end();
  }
}

run();
