const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key for bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Generating 500 mock volunteers...')
  const volunteers = []
  
  for (let i = 1; i <= 500; i++) {
    volunteers.push({
      snk_id: `SNK-LOAD-${String(i).padStart(4, '0')}`,
      full_name: `Load Volunteer ${i}`,
      status: 'Approved',
      mobile_number: '1234567890'
    })
  }

  // Insert in batches of 100
  let successCount = 0
  for (let i = 0; i < volunteers.length; i += 100) {
    const batch = volunteers.slice(i, i + 100)
    const { error } = await supabase.from('volunteers').insert(batch)
    if (error) {
      console.error('Error inserting batch:', error.message)
      break
    }
    successCount += batch.length
    console.log(`Inserted ${successCount}/500...`)
  }
  
  console.log('Finished generating volunteers.')
}

run()
