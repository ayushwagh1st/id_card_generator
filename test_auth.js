const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Try to insert a user
  const { data, error } = await supabase.auth.admin.createUser({
      email: 'test_trigger_check@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'LECTURER', name: 'Test User' }
  });
  console.log("Create user result:", error ? error.message : "Success");
  
  if (data?.user) {
      await supabase.auth.admin.deleteUser(data.user.id);
  }
}
check();
