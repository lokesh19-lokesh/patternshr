import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsnkmjuyloueeuyxtulq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbmttanV5bG91ZWV1eXh0dWxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkzODk2NSwiZXhwIjoyMTAyNTE0OTY1fQ.BIZ9KZMyvJdMIjD7RCh2pyriMKsKBbKAXp1GYgV-bsU';

async function testFetch() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  const companyId = '03014b36-364a-4d37-9e8d-29d1d6e4d9ee';
  
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id, employee_id, first_name, last_name, email, phone, status, joining_date, department_id, designation_id,
      department:departments(id, name),
      designation:designations(id, name)
    `)
    .eq('company_id', companyId)
    .order('first_name');
    
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
testFetch();
