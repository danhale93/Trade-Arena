// Supabase client (backend)
// Uses environment variables:
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
// Optional for server-side writes (recommended):
//   SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js');

function getEnv(name, fallback = undefined) {
  return process.env[name] ?? fallback;
}

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const hasConfig = Boolean(SUPABASE_URL && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY));

// If Supabase is not configured, we still export stubs so the server can boot.
const supabase = hasConfig
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

module.exports = {
  supabase,
  hasSupabase: hasConfig,
  SUPABASE_URL,
};
