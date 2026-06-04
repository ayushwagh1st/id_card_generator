const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const userId = '11111111-2222-3333-4444-555555555555';
  
  const { data, error } = await supabaseAdmin.from('lecturers').insert([{
    id: userId,
    name: "Test Lecturer Profile",
    email: "test_lecturer_profile@example.com",
    mobile: "1234567890",
    password: "password",
    status: "Active"
  }]).select().single()

  console.log("Insert lecturer profile result (Service Role):", error ? error.message : "Success");
  
  if (data) {
      await supabaseAdmin.from('lecturers').delete().eq('id', userId);
  }
}
check();
