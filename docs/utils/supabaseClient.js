// Supabase client — shared by admin app and client portal
const SUPABASE_URL = 'https://ezxfgawujagatrqylyvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eGZnYXd1amFnYXRycXlseXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODQwMDEsImV4cCI6MjA5MjY2MDAwMX0.KLda0-iEnFWrN90GMzlkpZrC3d_aGVJUjnuhBP3EcuQ';

// If this is the client portal (token in URL or localStorage), include it as a header
// so Supabase RLS policies can filter data to that client only.
const _portalToken = new URLSearchParams(window.location.search).get('token')
  || localStorage.getItem('nativa_client_token') || '';

const SupabaseDB = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  global: _portalToken ? { headers: { 'x-client-token': _portalToken } } : {},
});
