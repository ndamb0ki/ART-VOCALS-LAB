// Ndambuki Art Lab — Supabase connection

const SUPABASE_URL = "https://hvvdtmrlzzykyhgoswsf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_q1w64QWtMoIx8BQohFMenA_bybkfnCz";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
