const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.auth.admin.createUser({
      email: 'test_trigger_check2@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'TEST', full_name: 'Test User' }
  });
  console.log("Create user with full_name result:", error ? error.message : "Success");
  
  if (data?.user) {
      await supabase.auth.admin.deleteUser(data.user.id);
  }
}
check();
