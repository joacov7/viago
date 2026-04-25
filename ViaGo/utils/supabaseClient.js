// Supabase client — shared by admin app and client portal
const SUPABASE_URL = 'https://ezxfgawujagatrqylyvo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_88E9w6Nrvzb8EU8Ct3az6w_05Buvfwe';
const SupabaseDB = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
