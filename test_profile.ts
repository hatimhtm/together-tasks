import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-key'
const supabase = createClient(supabaseUrl, supabaseKey)
async function run() {
  const { data, error } = await supabase.from('profiles').select('*, partner:profiles!partner_id(id, theme, username, briefing_time, briefing_enabled, weekly_review_enabled)').limit(1)
  console.log("data:", JSON.stringify(data, null, 2))
  console.log("error:", error)
}
run()
