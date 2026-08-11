// lib/supabaseAdmin.js
// A separate Supabase client for server-side/serverless use, so the cron
// function isn't importing your browser client bundle. Since your tables
// currently use "allow all" RLS policies, the anon key works fine here too —
// this just keeps server and browser clients decoupled so that when you add
// Supabase Auth later, you can swap this one for a service-role key without
// touching the frontend.

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

module.exports = { supabaseAdmin };