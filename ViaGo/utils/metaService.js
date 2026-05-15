// Meta Ads service — configurá estas dos variables con tus credenciales de Supabase
const META_SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const META_SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const MetaService = {
  async _proxy(endpoint, params = {}) {
    const res = await fetch(`${META_SUPABASE_URL}/functions/v1/meta-api-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${META_SUPABASE_ANON_KEY}`,
        'apikey': META_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ endpoint, params }),
    });
    if (!res.ok) throw new Error(`Edge Function error ${res.status}`);
    return res.json();
  },

  getCampaigns() {
    return this._proxy('campaigns');
  },

  getAccountInsights(datePreset = 'last_30d') {
    return this._proxy('account_insights', { date_preset: datePreset });
  },

  getCampaignInsights(campaignId, datePreset = 'last_30d') {
    return this._proxy('campaign_insights', { campaign_id: campaignId, date_preset: datePreset });
  },

  createCampaign(data) {
    return this._proxy('create_campaign', data);
  },

  updateCampaignStatus(campaignId, status) {
    return this._proxy('update_campaign', { campaign_id: campaignId, status });
  },

  async getLeads() {
    const res = await fetch(
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
