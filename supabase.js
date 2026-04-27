// Supabase Client - Trade Arena v4.2
// Setup: 1. Create free Supabase project at supabase.com
//        2. Copy URL + anon key to .env
//        3. npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env ? import.meta.env.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

console.log('🔌 Supabase client ready (check console for connection status)')

// Schema helper - run once in Supabase SQL Editor
export async function initSchema() {
  const { data, error } = await supabase.rpc('init_schema')
  if (error) console.error('Schema init failed:', error)
  else console.log('✅ Schema initialized:', data)
}

// Tables expected:
// users (id, email, wallet_address, created_at)
// trades (id, user_id, bot_id, token, method, entry_price, exit_price, pnl, timestamp)
// agent_stats (agent_key, win_rate, trades, weight, status, updated_at)

