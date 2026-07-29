// lib/supabaseAdmin.js
// A separate Supabase client for server-side/serverless use.

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

module.exports = { supabaseAdmin };
