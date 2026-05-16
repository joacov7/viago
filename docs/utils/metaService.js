// ── Configuración ─────────────────────────────────────────────────────────────
const META_SUPABASE_URL      = 'https://ezxfgawujagatrqylyvo.supabase.co';
const META_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eGZnYXd1amFnYXRycXlseXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODQwMDEsImV4cCI6MjA5MjY2MDAwMX0.KLda0-iEnFWrN90GMzlkpZrC3d_aGVJUjnuhBP3EcuQ';

const META_CONFIGURED = !!META_SUPABASE_URL && !META_SUPABASE_URL.includes('YOUR_PROJECT');

const _fetchTimeout = (url, opts = {}, ms = 8000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
};

const MetaService = {
  isConfigured() { return META_CONFIGURED; },

  async _proxy(endpoint, params = {}) {
    if (!META_CONFIGURED) throw new Error('not_configured');
    const res = await _fetchTimeout(
      `${META_SUPABASE_URL}/functions/v1/meta-api-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${META_SUPABASE_ANON_KEY}`,
          'apikey': META_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ endpoint, params }),
      }
    );
    if (!res.ok) throw new Error(`Edge Function error ${res.status}`);
    return res.json();
  },

  getCampaigns()                          { return this._proxy('campaigns'); },
  getAccountInsights(p = 'last_30d')      { return this._proxy('account_insights',  { date_preset: p }); },
  getCampaignInsights(id, p = 'last_30d') { return this._proxy('campaign_insights', { campaign_id: id, date_preset: p }); },
  createCampaign(data)                    { return this._proxy('create_campaign', data); },
  updateCampaignStatus(id, status)        { return this._proxy('update_campaign', { campaign_id: id, status }); },

  async getLeads() {
    if (!META_CONFIGURED) throw new Error('not_configured');
    const res = await _fetchTimeout(
      `${META_SUPABASE_URL}/rest/v1/meta_leads?order=created_at.desc&limit=200`,
      {
        headers: {
          'apikey': META_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${META_SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error(`DB error ${res.status}`);
    return res.json();
  },
};
