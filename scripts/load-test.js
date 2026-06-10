const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runLoadTest() {
  console.log('Starting load test for 500 volunteers...')
  
  // 1. Fetch the generated volunteers
  const { data: volunteers, error } = await supabase
    .from('volunteers')
    .select('id, snk_id')
    .like('snk_id', 'SNK-LOAD-%')
    .limit(500)

  if (error || !volunteers || volunteers.length === 0) {
    console.error('Could not fetch mock volunteers. Run generate-volunteers.js first.')
    return
  }
  
  console.log(`Found ${volunteers.length} load test volunteers.`)
  
  // 2. We need a dummy session to check them into. Let's create one.
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .insert([{
      name: 'Load Test Session',
      category: 'Test Category',
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '12:00',
      status: 'Active'
    }])
    .select()
    .single()

  if (sessionError) {
    console.error('Failed to create test session', sessionError)
    return
  }

  const sessionId = sessionData.id
  console.log(`Created test session: ${sessionId}`)

  // 3. Simulate 500 concurrent check-ins
  console.log('Simulating 500 concurrent CHECK_IN requests to Supabase...')
  const startTime = Date.now()
  
  const promises = volunteers.map(v => {
    return supabase.from('attendance').insert([{
      session_id: sessionId,
      volunteer_id: v.id,
      attendance_status: 'Present',
      check_in_time: new Date().toISOString(),
      attendance_date: new Date().toISOString().split('T')[0]
    }])
  })

  const results = await Promise.allSettled(promises)
  const endTime = Date.now()

  const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error).length
  const failed = results.length - successful

  console.log(`--- Load Test Results ---`)
  console.log(`Total Requests: 500`)
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)
  if (failed > 0 && results.find(r => r.status === 'fulfilled' && r.value.error)) {
    console.log(`First error:`, results.find(r => r.status === 'fulfilled' && r.value.error).value.error)
  }
  console.log(`Time taken: ${endTime - startTime} ms`)
  
  // Cleanup test session and records
  console.log('Cleaning up...')
  await supabase.from('attendance').delete().eq('session_id', sessionId)
  await supabase.from('sessions').delete().eq('id', sessionId)
  
  console.log('Load test completed.')
}

runLoadTest()
