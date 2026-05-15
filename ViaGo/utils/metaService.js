// ─── Configuración ───────────────────────────────────────────────────────────
// Reemplazá estos valores con los de tu proyecto Supabase
const META_SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
const META_SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const CONFIGURED =
  !META_SUPABASE_URL.includes('YOUR_PROJECT') &&
  !META_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fetchWithTimeout = (url, opts = {}, ms = 8000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
};

// ─── Servicio ─────────────────────────────────────────────────────────────────
const MetaService = {
  isConfigured() {
    return CONFIGURED;
  },

  async _proxy(endpoint, params = {}) {
    if (!CONFIGURED) throw new Error('not_configured');
    const res = await fetchWithTimeout(
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
    if (!CONFIGURED) throw new Error('not_configured');
    const res = await fetchWithTimeout(
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
