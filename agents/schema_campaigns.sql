-- Campañas
create table if not exists campaigns (
  id          serial primary key,
  name        text not null,
  message     text not null,                    -- template con {nombre}
  segment     text not null,                    -- 'inactive_30','inactive_60','zone','all','custom'
  segment_data jsonb default '{}',              -- {zone_id:X} o {client_ids:[...]}
  discount_pct numeric(5,2) default 0,
  status      text default 'pending',           -- pending,active,completed,cancelled
  scheduled_at timestamptz,
  expires_at  timestamptz,
  clients_targeted  int default 0,
  clients_contacted int default 0,
  orders_after      int default 0,
  created_at  timestamptz default now()
);

-- Contactos por campaña (1 fila por cliente contactado)
create table if not exists campaign_contacts (
  id          serial primary key,
  campaign_id int references campaigns(id) on delete cascade,
  client_id   int references clients(id),
  client_name text,
  phone       text,
  wa_link     text,
  sent_at     timestamptz default now(),
  converted   boolean default false
);

-- Permisos
alter table campaigns        disable row level security;
alter table campaign_contacts disable row level security;
grant all on campaigns         to anon;
grant all on campaign_contacts to anon;
grant usage, select on sequence campaigns_id_seq          to anon;
grant usage, select on sequence campaign_contacts_id_seq  to anon;
