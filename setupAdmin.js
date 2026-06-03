const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setup() {
  const email = 'admin@voluntrack.com';
  const password = 'SecurePassword123!';

  console.log('Checking if admin user exists...');
  
  // Create user using admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { role: 'SUPER_ADMIN' }
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('already been registered')) {
        console.log('User already exists! Updating role to SUPER_ADMIN...');
        // Update existing user
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const user = usersData.users.find(u => u.email === email);
        if (user) {
            await supabase.auth.admin.updateUserById(user.id, {
                password: password,
                email_confirm: true,
                user_metadata: { role: 'SUPER_ADMIN' }
            });
            console.log('Role and password updated.');
        }
    } else {
        console.error('Error creating user:', error.message);
    }
  } else {
    console.log(`Success! Admin user created.`);
  }
  
  console.log(`\nYou can now login with:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

setup();
