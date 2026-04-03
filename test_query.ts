import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
async function run() {
  const { data, error } = await supabase.from('profiles').select('*, partner:profiles!partner_id(id)').limit(1)
  console.log("data:", data)
  console.log("error:", error)
}
run()
