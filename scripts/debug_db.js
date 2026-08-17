import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsnkmjuyloueeuyxtulq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbmttanV5bG91ZWV1eXh0dWxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkzODk2NSwiZXhwIjoyMTAyNTE0OTY1fQ.BIZ9KZMyvJdMIjD7RCh2pyriMKsKBbKAXp1GYgV-bsU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function testFetch() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'yestickai@gmail.com');
  
  if (!user) return console.log('no user');

  const { data: memberData, error: memberError } = await supabase
    .from('company_members')
    .select(`
      company_id,
      role_id,
      companies ( id, name, logo_url ),
      roles ( id, name, is_system_role )
    `)
    .eq('user_id', user.id)
    .limit(1)
    .single();

  console.log('memberData:', JSON.stringify(memberData, null, 2));
  console.log('memberError:', memberError);
}

testFetch();
