import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsnkmjuyloueeuyxtulq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbmttanV5bG91ZWV1eXh0dWxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkzODk2NSwiZXhwIjoyMTAyNTE0OTY1fQ.BIZ9KZMyvJdMIjD7RCh2pyriMKsKBbKAXp1GYgV-bsU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function cleanup() {
  const { data: members } = await supabase.from('company_members').select('*');
  
  // Keep the first one for this user
  const userMembers = members.filter(m => m.user_id === '2e685b0f-2c0b-4b1d-b3d9-cd7096689926');
  
  if (userMembers.length > 1) {
    // Sort by created_at
    userMembers.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Keep first, delete rest
    const toDelete = userMembers.slice(1);
    
    for (const mem of toDelete) {
      await supabase.from('companies').delete().eq('id', mem.company_id);
      console.log('Deleted duplicate company:', mem.company_id);
    }
  }
}

cleanup();
