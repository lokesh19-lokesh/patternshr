import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: emps } = await supabase.from('employees').select('id, email, profile_id');
  console.log('Employees:', emps);
  const { data: profs } = await supabase.from('profiles').select('id, email');
  console.log('Profiles:', profs);
  
  // Link them
  for (const emp of emps || []) {
    const prof = profs?.find(p => p.email === emp.email);
    if (prof && !emp.profile_id) {
      console.log('Linking', emp.email, 'to profile', prof.id);
      await supabase.from('employees').update({ profile_id: prof.id }).eq('id', emp.id);
    }
  }
}
run();
