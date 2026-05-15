-- Tabla de leads capturados desde Meta Lead Ads
CREATE TABLE IF NOT EXISTS meta_leads (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  lead_id     text UNIQUE,
  form_id     text,
  ad_id       text,
  adset_id    text,
  campaign_id text,
  page_id     text,
  full_name   text,
  email       text,
  phone       text,
  raw_fields  jsonb,
  processed   boolean DEFAULT false
);

ALTER TABLE meta_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service full access" ON meta_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon read" ON meta_leads
  FOR SELECT TO anon USING (true);
