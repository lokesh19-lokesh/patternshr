import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsnkmjuyloueeuyxtulq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbmttanV5bG91ZWV1eXh0dWxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkzODk2NSwiZXhwIjoyMTAyNTE0OTY1fQ.BIZ9KZMyvJdMIjD7RCh2pyriMKsKBbKAXp1GYgV-bsU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function linkEmployee() {
  const { data: users } = await supabase.auth.admin.listUsers();
  
  const { data: emps, error: empErr } = await supabase.from('employees').select('id, email, profile_id');
  console.log('Employees:', emps);
  
  const { data: profs, error: profErr } = await supabase.from('profiles').select('id, email');
  console.log('Profiles:', profs);

  for (const emp of emps || []) {
    const user = users.users.find(u => u.email === emp.email);
    const prof = profs?.find(p => p.email === emp.email);
    
    // Check if auth user exists and matches employee email
    if (user && prof && !emp.profile_id) {
      console.log('Linking', emp.email, 'to profile', prof.id);
      const { error } = await supabase.from('employees').update({ profile_id: prof.id }).eq('id', emp.id);
      if (error) console.error('Update error:', error);
    }
  }
}

linkEmployee();
