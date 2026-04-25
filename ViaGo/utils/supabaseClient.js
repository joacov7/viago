// Supabase client — shared by admin app and client portal
const SUPABASE_URL = 'https://ezxfgawujagatrqylyvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eGZnYXd1amFnYXRycXlseXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODQwMDEsImV4cCI6MjA5MjY2MDAwMX0.KLda0-iEnFWrN90GMzlkpZrC3d_aGVJUjnuhBP3EcuQ';
const SupabaseDB = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
