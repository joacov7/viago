// NATIVA Viago — Portal del cliente · Sistema Glaciar
// Diseño: viago/design_handoff_viago_glaciar
// Lógica: Supabase + DataService + token-based auth (sin cambios)

// ─── Icons ────────────────────────────────────────────────────────────────────

const VI = {
  drop: ({ size = 24, w = 1.8, filled = false }) => filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5c-3 4.2-6.3 8-6.3 11.5a6.3 6.3 0 0 0 12.6 0c0-3.5-3.3-7.3-6.3-11.5z"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5c-3 4.2-6.3 8-6.3 11.5a6.3 6.3 0 0 0 12.6 0c0-3.5-3.3-7.3-6.3-11.5z"/>
    </svg>
  ),
  bottle: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3h4M10 3v3.5a3 3 0 0 1-.6 1.8L8 10v9.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5V10l-1.4-1.7A3 3 0 0 1 14 6.5V3"/><path d="M8 14h8"/>
    </svg>
  ),
  bidon: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="15" rx="2"/><path d="M9 3h6v3H9z"/><path d="M6 13h12"/>
    </svg>
  ),
  truck: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
      <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  ),
  receipt: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18l3-2 3 2 3-2 3 2 3-2V3z"/><path d="M9 8h6M9 12h6M9 16h4"/>
    </svg>
  ),
  bag: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3l-2 4v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-4z"/><path d="M4 7h16M9 11a3 3 0 0 0 6 0"/>
    </svg>
  ),
  gift: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8"/>
    </svg>
  ),
  home: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>
    </svg>
  ),
  bell: ({ size = 20, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  arrowRight: ({ size = 16, w = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
  arrowUpRight: ({ size = 14, w = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M7 7h10v10"/>
    </svg>
  ),
  check: ({ size = 16, w = 2.2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  plus: ({ size = 16, w = 2.2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  minus: ({ size = 16, w = 2.2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
    </svg>
  ),
  recycle: ({ size = 20, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 19H4.8a1.6 1.6 0 0 1-1.4-2.4l1.5-2.6"/><path d="M11 19h8.7a1.6 1.6 0 0 0 1.4-2.4l-1.9-3.3"/>
      <path d="M16.5 9.5l2.4-1.4a1.6 1.6 0 0 0 .6-2.2l-1.5-2.6a1.6 1.6 0 0 0-2.2-.5l-2.4 1.4"/>
      <path d="M10 4l-2.8 4.8M7.2 8.8L4.4 13"/><path d="M16.5 9.5l-2.8-4.8"/>
    </svg>
  ),
  card: ({ size = 20, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h3"/>
    </svg>
  ),
  star: ({ size = 18, w = 1.8, filled = false }) => filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9L2 9.3l6.9-1z"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9L2 9.3l6.9-1z"/>
    </svg>
  ),
  share: ({ size = 18, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  ),
};

const WhatsAppSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23z"/>
  </svg>
);

// ─── Tokens ───────────────────────────────────────────────────────────────────

const G = {
  bg:          '#FFFFFF',
  surface:     '#FFFFFF',
  surfaceHi:   '#F4F6F8',
  surfaceLo:   '#FAFBFC',
  text:        '#0A0F14',
  muted:       '#6B7280',
  dim:         '#A0A6AE',
  hairline:    'rgba(10,15,20,0.08)',
  accent:      '#0091B8',
  accentDeep:  '#005670',
  accentSoft:  '#E6F4F8',
  whatsapp:    '#25D366',
  success:     '#1A8C3E',
  successSoft: 'rgba(26,140,62,0.10)',
  warning:     '#C77800',
  warningSoft: 'rgba(199,120,0,0.10)',
  danger:      '#D70015',
  dangerSoft:  'rgba(215,0,21,0.08)',
};

const GFF = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue",Inter,system-ui,sans-serif';

const fmt = (n) => DataService.formatCurrency ? DataService.formatCurrency(n) : ('$' + (n || 0).toLocaleString('es-AR'));

// ─── Primitives ───────────────────────────────────────────────────────────────

function GCard({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: G.surface, borderRadius: 16,
      border: `0.5px solid ${G.hairline}`, padding: 14,
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  );
}

function GSection({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '20px 4px 10px' }}>
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>{children}</span>
      {right}
    </div>
  );
}

function GPill({ label, kind = 'neutral' }) {
  const map = {
    neutral: { bg: G.surfaceHi,    fg: G.muted },
    success: { bg: G.successSoft,  fg: G.success },
    warning: { bg: G.warningSoft,  fg: G.warning },
    danger:  { bg: G.dangerSoft,   fg: G.danger },
    accent:  { bg: G.accentSoft,   fg: G.accentDeep },
  };
  const s = map[kind] || map.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 999,
      background: s.bg, color: s.fg,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.2, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.fg, flexShrink: 0 }}/>
      {label}
    </span>
  );
}

function Stepper({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <button onClick={() => onChange(value - 1)} disabled={value === 0} style={{
        width: 32, height: 32, borderRadius: 9,
        background: G.surfaceHi, border: 'none',
        color: value === 0 ? G.dim : G.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: value === 0 ? 'default' : 'pointer',
      }}><VI.minus size={14} w={2.4}/></button>
      <span style={{ width: 22, textAlign: 'center', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: value > 0 ? G.text : G.dim }}>{value}</span>
      <button onClick={() => onChange(value + 1)} style={{
        width: 32, height: 32, borderRadius: 9,
        background: G.accent, color: '#fff', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}><VI.plus size={14} w={2.4}/></button>
    </div>
  );
}

function SuccessScene({ title, sub, extra }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: G.bg, color: G.text, fontFamily: GFF,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>
      <style>{`@keyframes gPop{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: G.successSoft, color: G.success,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        animation: 'gPop .4s cubic-bezier(.34,1.56,.64,1)',
      }}><VI.check size={42} w={2.4}/></div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8 }}>{title}</div>
      <div style={{ fontSize: 14, color: G.muted, marginTop: 8, maxWidth: 280, lineHeight: 1.4 }}>{sub}</div>
      {extra}
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function GTabBar({ tab, onTab, showStore, showReferrals }) {
  const tabs = [
    { id: 'home',     label: 'Inicio',   ico: 'home' },
    { id: 'order',    label: 'Pedir',    ico: 'drop' },
    { id: 'orders',   label: 'Pedidos',  ico: 'bidon' },
    ...(showStore ? [{ id: 'store', label: 'Tienda', ico: 'bag' }] : []),
    { id: 'invoices', label: 'Facturas', ico: 'receipt' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: `0.5px solid ${G.hairline}`,
      display: 'flex', padding: '8px 0 24px',
      zIndex: 100,
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            flex: 1, background: 'none', border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: active ? G.text : G.dim,
            padding: '6px 0', cursor: 'pointer', fontFamily: GFF,
          }}>
            {React.createElement(VI[t.ico], { size: 22, w: active ? 2.2 : 1.8 })}
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.1 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function PortalHome({ client, config, onTab, onRefresh }) {
  const [products, setProducts] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      DataService.getProducts(),
      DataService.getClientOrders(client.id),
    ]).then(([prods, ords]) => {
      setProducts(prods.slice(0, 4));
      setOrders(ords);
      setLoading(false);
    });
  }, [client.id]);

  const nextOrder = orders.find(o => o.status === 'pendiente' || o.status === 'en_camino');
  const recentActivity = orders.slice(0, 3);
  const pts = client.points || 0;
  const ptsForReward = config.pointsForReward || 100;
  const pctPts = ptsForReward > 0 ? Math.min(100, Math.round(pts / ptsForReward * 100)) : 0;
  const segCount = 10;
  const segsOn = Math.round(pctPts / (100 / segCount));
  const initial = (client.name || '?')[0].toUpperCase();

  const prodsForCarousel = products.length ? products : [];

  const STATUS_MAP = {
    pendiente:  { label: 'Pendiente', kind: 'warning' },
    en_camino:  { label: 'En camino', kind: 'accent' },
    entregado:  { label: 'Entregado', kind: 'success' },
    cancelado:  { label: 'Cancelado', kind: 'danger' },
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 100px', fontFamily: GFF }}>

      {/* Header */}
      <div style={{ padding: '8px 4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: G.accent }}><VI.drop size={26} w={1.6} filled/></div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.4, color: G.text }}>{config.companyName || 'NATIVA'}</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: G.text, color: G.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
        }}>{initial}</div>
      </div>

      {/* Greeting */}
      <div style={{ padding: '4px 4px 14px' }}>
        <div style={{ fontSize: 13, color: G.muted, fontWeight: 500 }}>Hola, {client.name?.split(' ')[0] || 'cliente'}</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>
          {config.tagline || 'Tu agua, en orden.'}
        </div>
      </div>

      {/* Hero card — next delivery or CTA */}
      <div style={{
        background: `linear-gradient(170deg, ${G.accentDeep} 0%, #0A2433 100%)`,
        color: '#fff', borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.18, color: '#fff' }}>
          <VI.drop size={180} w={0} filled/>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.7 }}>
            {nextOrder ? 'Próxima entrega' : 'Tu pedido'}
          </div>
          {nextOrder ? (
            <>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, marginTop: 6 }}>
                {nextOrder.deliveryDate ? DataService.formatDate(nextOrder.deliveryDate) : 'Pendiente'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                {nextOrder.items?.length ? `${nextOrder.items.reduce((s,i)=>s+(i.quantity||1),0)} unidades` : 'Sin ítems'} · {fmt(nextOrder.total)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, marginTop: 6, lineHeight: 1.15 }}>
                Pedí cuando<br/>quieras
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Agua de vertiente a tu puerta.</div>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button onClick={() => onTab('order')} style={{
              flex: 1, padding: '12px 14px',
              background: '#fff', color: G.text, border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 600, letterSpacing: -0.2, fontFamily: GFF, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <VI.drop size={14} w={2} filled/> Pedir ahora
            </button>
            {nextOrder && (
              <button onClick={() => onTab('orders')} style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.14)', color: '#fff',
                border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: 12,
                fontSize: 14, fontWeight: 500, fontFamily: GFF, cursor: 'pointer',
              }}>Ver pedido</button>
            )}
          </div>
        </div>
      </div>

      {/* Tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <GCard style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: G.muted }}>
            <VI.card size={14} w={2}/>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Saldo</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(client.balance || 0)}
          </div>
          <div style={{ fontSize: 11, color: G.dim, marginTop: 2 }}>{(client.balance || 0) <= 0 ? 'al día' : 'pendiente'}</div>
        </GCard>
        <GCard style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: G.muted }}>
            <VI.bidon size={14} w={2}/>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Pedidos</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {orders.filter(o => o.status === 'entregado').length}
          </div>
          <div style={{ fontSize: 11, color: G.dim, marginTop: 2 }}>entregados en total</div>
        </GCard>
      </div>

      {/* Loyalty card */}
      {(pts > 0 || ptsForReward > 0) && (
        <GCard style={{ padding: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: G.muted, marginBottom: 10 }}>
            <VI.star size={14} w={2}/>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Puntos Glaciar</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{pts}</span>
            <span style={{ fontSize: 13, color: G.muted, fontWeight: 500 }}>/ {ptsForReward}</span>
          </div>
          <div style={{ fontSize: 12, color: G.muted, marginBottom: 12 }}>
            {Math.max(0, ptsForReward - pts)} pts para tu próximo premio
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: segCount }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < segsOn ? G.accent : G.surfaceHi }}/>
            ))}
          </div>
        </GCard>
      )}

      {/* Streak tiles */}
      {config.streaksEnabled && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
          {[
            { label: 'Pedidos', val: client.orderStreak || 0, ico: 'bidon', every: config.streakOrderRewardEvery || 0, pts: config.streakOrderRewardPts || 50 },
            { label: 'Bidones', val: client.containerStreak || 0, ico: 'recycle', every: config.streakContainerRewardEvery || 0, pts: config.streakContainerRewardPts || 75 },
            { label: 'Pagos', val: client.payStreak || 0, ico: 'card', every: config.streakPayRewardEvery || 0, pts: config.streakPayRewardPts || 100 },
          ].map(s => (
            <GCard key={s.label} style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: G.muted, marginBottom: 6 }}>
                {React.createElement(VI[s.ico], { size: 12, w: 2 })}
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', color: s.val > 0 ? G.accent : G.dim }}>
                {s.val}
              </div>
              {s.every > 0 && s.val > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: Math.min(s.every, 5) }).map((_, i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < (s.val % s.every) ? G.accent : G.surfaceHi }}/>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: G.dim, marginTop: 3 }}>{s.every - (s.val % s.every)} para +{s.pts}pts</div>
                </div>
              )}
            </GCard>
          ))}
        </div>
      )}

      {/* Products carousel */}
      {prodsForCarousel.length > 0 && (
        <>
          <GSection right={
            config.storeEnabled
              ? <span onClick={() => onTab('store')} style={{ fontSize: 13, color: G.accent, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Catálogo <VI.arrowUpRight size={12} w={2.2}/>
                </span>
              : null
          }>Productos</GSection>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {prodsForCarousel.map((p, i) => (
              <button key={p.id} onClick={() => onTab('order')} style={{
                flexShrink: 0, width: 144,
                background: i === 0 ? G.accent : G.surface,
                color: i === 0 ? '#fff' : G.text,
                border: i === 0 ? 'none' : `0.5px solid ${G.hairline}`,
                borderRadius: 16, padding: 14,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: 156, cursor: 'pointer', fontFamily: GFF, textAlign: 'left',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: i === 0 ? 'rgba(255,255,255,0.14)' : G.surfaceHi,
                  color: i === 0 ? '#fff' : G.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}><VI.bidon size={18} w={2}/></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{p.unit || ''}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Referrals CTA */}
      {config.referralsEnabled && (
        <>
          <GSection>Programa de referidos</GSection>
          <GCard style={{ padding: 16 }} onClick={() => onTab('referrals')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: G.accentSoft, color: G.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <VI.gift size={20} w={1.8}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>Invitá y ganan los dos</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Compartí tu código y sumá crédito</div>
              </div>
              <VI.arrowRight size={16} w={2}/>
            </div>
          </GCard>
        </>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <>
          <GSection right={
            <span onClick={() => onTab('orders')} style={{ fontSize: 13, color: G.accent, fontWeight: 500, cursor: 'pointer' }}>Ver todo</span>
          }>Actividad</GSection>
          <GCard style={{ padding: 0, overflow: 'hidden' }}>
            {recentActivity.map((o, i, arr) => {
              const s = STATUS_MAP[o.status] || STATUS_MAP.pendiente;
              const icoName = o.status === 'entregado' ? 'truck' : o.status === 'cancelado' ? 'receipt' : 'bidon';
              return (
                <div key={o.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderBottom: i < arr.length - 1 ? `0.5px solid ${G.hairline}` : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: o.status === 'entregado' ? G.accentSoft : G.surfaceHi,
                    color: o.status === 'entregado' ? G.accent : G.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{React.createElement(VI[icoName], { size: 16, w: 2 })}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.1 }}>
                      {o.items?.length ? `${o.items.reduce((s,x)=>s+(x.quantity||1),0)} unidades` : 'Pedido'} · {fmt(o.total)}
                    </div>
                    <div style={{ fontSize: 11, color: G.muted, marginTop: 1 }}>
                      {o.deliveryDate ? DataService.formatDate(o.deliveryDate) : ''}
                    </div>
                  </div>
                  <GPill label={s.label} kind={s.kind}/>
                </div>
              );
            })}
          </GCard>
        </>
      )}
    </div>
  );
}

// ─── Pedir ────────────────────────────────────────────────────────────────────

function PortalOrder({ client, config, onDone }) {
  const [products, setProducts] = React.useState([]);
  const [qtys, setQtys] = React.useState({});
  const [dates, setDates] = React.useState([]);
  const [selDate, setSelDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    DataService.getProducts().then(prods => {
      setProducts(prods);
      const init = {};
      prods.forEach(p => { init[p.id] = 0; });
      setQtys(init);
    });
    // Generate next 7 days
    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const ds = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
      ds.push({ iso, label });
    }
    setDates(ds);
    setSelDate(ds[0]?.iso || '');
  }, []);

  const setQty = (id, q) => setQtys(prev => ({ ...prev, [id]: Math.max(0, q) }));
  const items = products.filter(p => (qtys[p.id] || 0) > 0).map(p => ({
    productId: p.id, productName: p.name, quantity: qtys[p.id],
    price: p.price, subtotal: p.price * qtys[p.id],
  }));
  const total = items.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async () => {
    if (!items.length) return;
    setSaving(true);
    try {
      await DataService.createOrder({
        clientId: client.id, deliveryDate: selDate, items, total,
        status: 'pendiente', notes, source: 'portal',
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onDone && onDone(); }, 2400);
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  };

  if (success) return <SuccessScene title="Pedido enviado" sub={`Te avisamos por WhatsApp cuando salga el camión.`}/>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 140px', fontFamily: GFF }}>

      {/* Header */}
      <div style={{ padding: '6px 4px 16px' }}>
        <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 2 }}>Nuevo pedido</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>Pedir</div>
      </div>

      {/* Products */}
      <GCard style={{ padding: 0, overflow: 'hidden' }}>
        {products.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: G.dim, fontSize: 14 }}>Cargando productos...</div>
        ) : products.map((p, i, arr) => {
          const q = qtys[p.id] || 0;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
              borderBottom: i < arr.length - 1 ? `0.5px solid ${G.hairline}` : 'none',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: q > 0 ? G.accentSoft : G.surfaceHi,
                color: q > 0 ? G.accent : G.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all .2s',
              }}><VI.bidon size={22} w={1.9}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>{p.unit || ''}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: G.accentDeep, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.price)}</div>
              </div>
              <Stepper value={q} onChange={(v) => setQty(p.id, v)}/>
            </div>
          );
        })}
      </GCard>

      {/* Delivery date */}
      <GSection>Entrega</GSection>
      <GCard style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${G.hairline}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Fecha</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
            {dates.map(d => (
              <button key={d.iso} onClick={() => setSelDate(d.iso)} style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 999,
                background: selDate === d.iso ? G.accent : G.surfaceHi,
                color: selDate === d.iso ? '#fff' : G.text,
                border: 'none', fontSize: 13, fontWeight: 500, fontFamily: GFF, cursor: 'pointer',
              }}>{d.label}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Dirección</div>
          <div style={{ fontSize: 13, color: G.text, marginTop: 6 }}>{client.address || 'Sin dirección registrada'}</div>
          {client.city && <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{client.city}</div>}
        </div>
      </GCard>

      {/* Notes */}
      <GSection>Notas (opcional)</GSection>
      <GCard style={{ padding: 0 }}>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Tocá timbre dos veces, dejar en portería..."
          rows={3}
          style={{
            width: '100%', border: 'none', outline: 'none',
            background: 'transparent', color: G.text,
            padding: '12px 14px', resize: 'none',
            fontFamily: GFF, fontSize: 14, boxSizing: 'border-box',
          }}/>
      </GCard>

      {/* Floating total */}
      <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '0 12px', zIndex: 10 }}>
        <div style={{
          background: G.text, color: G.bg, borderRadius: 18, padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.6, letterSpacing: 0.4, textTransform: 'uppercase' }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</span>
          </div>
          <button onClick={handleSubmit} disabled={items.length === 0 || saving} style={{
            width: '100%', padding: '13px',
            background: items.length === 0 || saving ? 'rgba(255,255,255,0.12)' : '#fff',
            color: items.length === 0 || saving ? 'rgba(255,255,255,0.4)' : G.text,
            border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 600, letterSpacing: -0.2, fontFamily: GFF,
            cursor: items.length === 0 || saving ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <VI.check size={16} w={2.4}/>
            {saving ? 'Enviando...' : 'Confirmar pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

function PortalOrders({ client }) {
  const [orders, setOrders] = React.useState([]);
  const [filter, setFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    DataService.getClientOrders(client.id).then(ords => {
      setOrders(ords);
      setLoading(false);
    });
  }, [client.id]);

  const STATUS = {
    pendiente:  { label: 'Pendiente',  kind: 'warning' },
    en_camino:  { label: 'En camino',  kind: 'accent' },
    entregado:  { label: 'Entregado',  kind: 'success' },
    cancelado:  { label: 'Cancelado',  kind: 'danger' },
  };

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthOrders = orders.filter(o => (o.deliveryDate || o.createdAt || '').startsWith(thisMonth));
  const monthSpend = monthOrders.filter(o => o.status === 'entregado').reduce((s, o) => s + (o.total || 0), 0);
  const bidonesDevueltos = 0; // no column yet in schema

  const FILTERS = [
    { id: 'all',       label: 'Todos',      count: orders.length },
    { id: 'en_camino', label: 'En camino',  count: orders.filter(o => o.status === 'en_camino').length },
    { id: 'entregado', label: 'Entregados', count: orders.filter(o => o.status === 'entregado').length },
    { id: 'cancelado', label: 'Cancelados', count: orders.filter(o => o.status === 'cancelado').length },
  ];

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 100px', fontFamily: GFF }}>
      <div style={{ padding: '6px 4px 16px' }}>
        <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 2 }}>Tu historial</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>Pedidos</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { label: 'Este mes', val: monthOrders.length, sub: 'pedidos', numStyle: {} },
          { label: 'Gasto', val: fmt(monthSpend), sub: 'últimos 30 días', numStyle: {} },
          { label: 'Total', val: orders.filter(o=>o.status==='entregado').length, sub: 'entregados', numStyle: { color: G.success } },
        ].map(s => (
          <GCard key={s.label} style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.6, marginTop: 6, fontVariantNumeric: 'tabular-nums', ...s.numStyle }}>{s.val}</div>
            <div style={{ fontSize: 11, color: G.dim, marginTop: 2 }}>{s.sub}</div>
          </GCard>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '16px 0 4px', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {FILTERS.filter(f => f.count > 0 || f.id === 'all').map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flexShrink: 0, padding: '8px 13px', borderRadius: 999,
            background: filter === f.id ? G.accent : G.surfaceHi,
            color: filter === f.id ? '#fff' : G.text,
            border: 'none', fontSize: 13, fontWeight: 500, fontFamily: GFF, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {f.label}
            <span style={{ fontSize: 11, fontWeight: 600, opacity: filter === f.id ? 0.7 : 0.6 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Order list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: G.dim }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 16px', textAlign: 'center', color: G.muted }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: G.surfaceHi, color: G.dim, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <VI.bidon size={24} w={1.7}/>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: G.text }}>Sin pedidos</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Tus pedidos aparecerán acá.</div>
          </div>
        ) : filtered.map(o => {
          const s = STATUS[o.status] || STATUS.pendiente;
          const itemCount = o.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;
          const itemLabel = o.items?.map(i => `${i.quantity || 1}× ${i.productName || 'Producto'}`).join(' · ') || '';
          return (
            <GCard key={o.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>#{o.id}</span>
                    <span style={{ fontSize: 12, color: G.muted, fontVariantNumeric: 'tabular-nums' }}>
                      {o.deliveryDate ? DataService.formatDate(o.deliveryDate) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: G.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {itemLabel || `${itemCount} unidades`}
                  </div>
                </div>
                <GPill label={s.label} kind={s.kind}/>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 10, marginTop: 4, borderTop: `0.5px solid ${G.hairline}`,
              }}>
                <span style={{ fontSize: 12, color: G.muted }}>
                  {o.notes && o.notes !== 'Generado automáticamente' ? o.notes : ''}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>{fmt(o.total)}</span>
              </div>
              {o.status === 'en_camino' && (
                <div style={{
                  marginTop: 12, padding: '10px 12px',
                  background: G.accentSoft, borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <VI.truck size={18} w={2}/>
                  <div style={{ flex: 1, fontSize: 12, color: G.accentDeep, fontWeight: 500 }}>Tu pedido está en camino</div>
                </div>
              )}
            </GCard>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tienda ───────────────────────────────────────────────────────────────────

function PortalStore({ client, config, onTab }) {
  const [products, setProducts] = React.useState([]);
  const [cat, setCat] = React.useState('all');
  const [cart, setCart] = React.useState({});
  const [screen, setScreen] = React.useState('browse');
  const [payMode, setPayMode] = React.useState('cash');
  const [pointsUsed, setPointsUsed] = React.useState(0);
  const [success, setSuccess] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { DataService.getProducts().then(setProducts); }, []);

  const clientPts = client.points || 0;
  const rate = parseFloat(config.pointsConversionRate) || 1;
  const CATS = [
    { id: 'all', label: 'Todo' },
    { id: 'bidon', label: 'Bidones' },
    { id: 'botella', label: 'Botellas' },
    { id: 'otro', label: 'Otros' },
  ];
  const filtered = cat === 'all' ? products : products.filter(p => p.type === cat);
  const setQty = (id, q) => setCart(prev => ({ ...prev, [id]: Math.max(0, q) }));
  const cartItems = products.filter(p => (cart[p.id] || 0) > 0).map(p => ({ ...p, qty: cart[p.id] }));
  const totalCash = cartItems.reduce((s, p) => s + p.price * p.qty, 0);
  const maxPts = Math.min(clientPts, Math.floor(totalCash / rate));
  const discount = Math.min(pointsUsed * rate, totalCash);
  const finalTotal = Math.max(0, totalCash - discount);
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  React.useEffect(() => {
    if (payMode === 'cash') setPointsUsed(0);
    if (payMode === 'points') setPointsUsed(Math.min(clientPts, Math.floor(totalCash / rate)));
    if (payMode === 'mixed') setPointsUsed(prev => Math.min(prev, maxPts));
  }, [payMode, totalCash]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const items = cartItems.map(p => ({
        productId: p.id, productName: p.name, quantity: p.qty, price: p.price, subtotal: p.price * p.qty,
      }));
      await DataService.createOrder({
        clientId: client.id, items, total: finalTotal,
        status: 'pendiente', notes: `Tienda · ${payMode}`, source: 'portal',
      });
      if (pointsUsed > 0) {
        await DataService.redeemPoints(client.id, pointsUsed, `Canje en tienda · ${fmt(discount)}`);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false); setCart({}); setScreen('browse'); setPointsUsed(0); setPayMode('cash');
        onTab && onTab('orders');
      }, 2400);
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  };

  if (success) return (
    <SuccessScene title="Pedido enviado" sub="Te avisamos cuando salga el camión."
      extra={pointsUsed > 0 ? (
        <div style={{ marginTop: 20, padding: '10px 18px', background: G.accentSoft, color: G.accentDeep, borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
          -{pointsUsed} puntos canjeados
        </div>
      ) : null}/>
  );

  if (screen === 'checkout') return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 140px', fontFamily: GFF }}>
      <div style={{ padding: '6px 4px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 2 }}>Resumen del pedido</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>Confirmar</div>
        </div>
        <button onClick={() => setScreen('browse')} style={{
          width: 36, height: 36, borderRadius: '50%', background: G.surfaceHi,
          border: 'none', color: G.text, fontSize: 16, cursor: 'pointer',
        }}>✕</button>
      </div>

      <GCard style={{ padding: 0, overflow: 'hidden' }}>
        {cartItems.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderBottom: i < cartItems.length - 1 ? `0.5px solid ${G.hairline}` : 'none',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: G.surfaceHi, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VI.bidon size={18} w={1.9}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: G.muted }}>{p.qty}× · {fmt(p.price)}</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.price * p.qty)}</span>
          </div>
        ))}
      </GCard>

      <GSection>Forma de pago</GSection>
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { id: 'cash', label: 'Dinero', disabled: false },
          { id: 'mixed', label: 'Mixto', disabled: clientPts === 0 },
          { id: 'points', label: 'Puntos', disabled: totalCash > clientPts * rate },
        ].map(m => (
          <button key={m.id} disabled={m.disabled} onClick={() => setPayMode(m.id)} style={{
            flex: 1, padding: '12px 0',
            background: payMode === m.id ? G.accent : G.surfaceHi,
            color: payMode === m.id ? '#fff' : G.text,
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 500, fontFamily: GFF, cursor: m.disabled ? 'default' : 'pointer',
            opacity: m.disabled ? 0.4 : 1,
          }}>{m.label}</button>
        ))}
      </div>

      {payMode === 'mixed' && maxPts > 0 && (
        <GCard style={{ marginTop: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: G.muted }}>Puntos a usar</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: G.accent, fontVariantNumeric: 'tabular-nums' }}>{pointsUsed} pts · {fmt(pointsUsed * rate)}</span>
          </div>
          <input type="range" min="0" max={maxPts} value={pointsUsed}
            onChange={e => setPointsUsed(parseInt(e.target.value))}
            style={{ width: '100%', marginTop: 10, accentColor: G.accent }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: G.dim }}>0</span>
            <span style={{ fontSize: 11, color: G.dim, fontVariantNumeric: 'tabular-nums' }}>{maxPts} pts máx</span>
          </div>
        </GCard>
      )}

      <GCard style={{ marginTop: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: G.muted }}>
          <span>Subtotal</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCash)}</span>
        </div>
        {pointsUsed > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: G.accent, marginTop: 6, fontWeight: 500 }}>
            <span>- {pointsUsed} puntos</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{fmt(discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${G.hairline}` }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{fmt(finalTotal)}</span>
        </div>
      </GCard>

      <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '0 12px', zIndex: 10 }}>
        <button onClick={handleConfirm} disabled={saving} style={{
          width: '100%', padding: '15px',
          background: G.accent, color: '#fff', border: 'none',
          borderRadius: 14, fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
          fontFamily: GFF, cursor: saving ? 'default' : 'pointer',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <VI.check size={16} w={2.4}/>{saving ? 'Procesando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 140px', fontFamily: GFF }}>
      <div style={{ padding: '6px 4px 16px' }}>
        <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 2 }}>Productos y canje</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>Tienda</div>
      </div>

      {/* Points banner */}
      {clientPts > 0 && (
        <GCard style={{ padding: 14, background: `linear-gradient(135deg,${G.accentDeep} 0%,#0A2433 100%)`, color: '#fff', borderColor: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VI.star size={18} w={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>Tus puntos</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                {clientPts} <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 500 }}>= {fmt(clientPts * rate)}</span>
              </div>
            </div>
          </div>
        </GCard>
      )}

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 12, paddingBottom: 2, scrollbarWidth: 'none' }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 999,
            background: cat === c.id ? G.accent : G.surfaceHi,
            color: cat === c.id ? '#fff' : G.text,
            border: 'none', fontSize: 13, fontWeight: 500, fontFamily: GFF, cursor: 'pointer',
          }}>{c.label}</button>
        ))}
      </div>

      {/* Products grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        {filtered.map(p => {
          const q = cart[p.id] || 0;
          return (
            <GCard key={p.id} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: '100%', aspectRatio: '1', maxHeight: 80, borderRadius: 10, background: G.surfaceHi, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.accent }}>
                <VI.bidon size={32} w={1.6}/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{p.unit || ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.price)}</div>
                  <div style={{ fontSize: 10, color: G.accent, fontWeight: 600, marginTop: 1 }}>{p.price} pts</div>
                </div>
                {q === 0 ? (
                  <button onClick={() => setQty(p.id, 1)} style={{ width: 30, height: 30, borderRadius: 9, background: G.accent, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <VI.plus size={14} w={2.4}/>
                  </button>
                ) : (
                  <Stepper value={q} onChange={(v) => setQty(p.id, v)}/>
                )}
              </div>
            </GCard>
          );
        })}
      </div>

      {/* Floating cart */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '0 12px', zIndex: 10 }}>
          <button onClick={() => setScreen('checkout')} style={{
            width: '100%', padding: '13px 18px',
            background: G.accent, color: '#fff', border: 'none',
            borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: GFF, cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{cartCount}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Ver carrito</span>
            <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCash)}</span>
            <VI.arrowRight size={14} w={2.4}/>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Facturas ─────────────────────────────────────────────────────────────────

function PortalInvoices({ client }) {
  const [invoices, setInvoices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    DataService.getClientInvoices(client.id).then(invs => {
      setInvoices(invs);
      setLoading(false);
    });
  }, [client.id]);

  const totalAmt = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const pendingAmt = invoices.filter(i => i.paymentStatus !== 'pagado').reduce((s, i) => s + (i.total || 0), 0);

  const METHOD_LABEL = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'MercadoPago', cuenta_corriente: 'Cta. corriente' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 100px', fontFamily: GFF }}>
      <div style={{ padding: '6px 4px 16px' }}>
        <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 2 }}>Tu cuenta</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>Facturas</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <GCard style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Histórico</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalAmt)}</div>
          <div style={{ fontSize: 11, color: G.dim, marginTop: 4 }}>{invoices.length} facturas</div>
        </GCard>
        <GCard style={{ padding: 16, background: pendingAmt > 0 ? G.warningSoft : G.successSoft, borderColor: pendingAmt > 0 ? 'rgba(199,120,0,0.18)' : 'rgba(26,140,62,0.18)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: pendingAmt > 0 ? G.warning : G.success, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {pendingAmt > 0 ? 'Pendiente' : 'Al día'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 8, color: pendingAmt > 0 ? G.warning : G.success, fontVariantNumeric: 'tabular-nums' }}>
            {pendingAmt > 0 ? fmt(pendingAmt) : '$0'}
          </div>
          {pendingAmt > 0 ? (
            <button style={{ marginTop: 8, padding: '5px 10px', background: G.warning, color: '#fff', border: 'none', borderRadius: 999, fontSize: 11, fontWeight: 600, fontFamily: GFF, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Pagar ahora <VI.arrowRight size={11} w={2.4}/>
            </button>
          ) : (
            <div style={{ fontSize: 11, color: G.success, marginTop: 4, fontWeight: 500 }}>Todas pagadas</div>
          )}
        </GCard>
      </div>

      <GSection>Facturas</GSection>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: G.dim }}>Cargando...</div>
      ) : invoices.length === 0 ? (
        <div style={{ padding: '60px 16px', textAlign: 'center', color: G.muted }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: G.surfaceHi, color: G.dim, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <VI.receipt size={24} w={1.7}/>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: G.text }}>Sin facturas</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Tus facturas aparecerán acá.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invoices.map(inv => (
            <GCard key={inv.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: G.surfaceHi, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <VI.receipt size={20} w={1.8}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>#{inv.id}</span>
                    <span style={{ fontSize: 12, color: G.muted }}>
                      {inv.createdAt ? DataService.formatDate(inv.createdAt.split('T')[0]) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>
                    {METHOD_LABEL[inv.paymentMethod] || inv.paymentMethod || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>{fmt(inv.total)}</div>
                  <div style={{ marginTop: 4 }}>
                    <GPill
                      label={inv.paymentStatus === 'pagado' ? 'Pagada' : 'Pendiente'}
                      kind={inv.paymentStatus === 'pagado' ? 'success' : 'warning'}
                    />
                  </div>
                </div>
              </div>
            </GCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Referidos ────────────────────────────────────────────────────────────────

function PortalReferrals({ client, config, onTab }) {
  const [copied, setCopied] = React.useState(false);
  const [referrals, setReferrals] = React.useState([]);

  React.useEffect(() => {
    DataService.getClients().then(cls => {
      setReferrals(cls.filter(c => c.referredBy === client.id));
    });
  }, [client.id]);

  const code = client.referralCode || '';
  const link = DataService.clientPortalUrl ? DataService.clientPortalUrl(client.accessToken) : '';
  const prizeEvery = config.referralPrizeEvery || 5;
  const referrerReward = config.referralReferrerReward || config.referralBonus || 500;
  const referredDiscount = config.referralReferredDiscount || 10;
  const shareMsg = (config.referralShareMessage || 'Hola! Usá mi código {codigo} y conseguís {desc}% off. {link}')
    .replace('{codigo}', code).replace('{desc}', referredDiscount).replace('{link}', link)
    .replace('{empresa}', config.companyName || 'NATIVA');

  const handleCopy = () => {
    navigator.clipboard?.writeText(code || link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: config.companyName || 'NATIVA', text: shareMsg, url: link });
    else handleCopy();
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 100px', fontFamily: GFF }}>
      <div style={{ padding: '6px 4px 16px' }}>
        <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 2 }}>Programa Glaciar</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>Referidos</div>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(170deg,${G.accentDeep} 0%,#0A2433 100%)`, color: '#fff', borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.15, color: '#fff' }}>
          <VI.drop size={200} w={0} filled/>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.7 }}>Invitá y ganan los dos</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 8, lineHeight: 1.1 }}>
            Tu agua,<br/>también para tus amigos.
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 8, lineHeight: 1.45, maxWidth: 260 }}>
            Compartí tu código. Ellos arrancan con {referredDiscount}% off, vos sumás {fmt(referrerReward)} de crédito.
          </div>
        </div>
      </div>

      {/* Rewards row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        <GCard style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Para vos</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 6, color: G.success, fontVariantNumeric: 'tabular-nums' }}>{fmt(referrerReward)}</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>crédito por referido</div>
        </GCard>
        <GCard style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Para tu amigo</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 6, color: G.accent, fontVariantNumeric: 'tabular-nums' }}>{referredDiscount}%</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>off en el primer pedido</div>
        </GCard>
      </div>

      {/* Code card */}
      {code && (
        <GCard style={{ marginTop: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Tu código</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: G.surfaceHi, borderRadius: 12, border: `1px dashed ${G.hairline}` }}>
            <div style={{ flex: 1, fontSize: 18, fontWeight: 700, letterSpacing: 0.5, fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace' }}>{code}</div>
            <button onClick={handleCopy} style={{
              padding: '8px 14px', background: copied ? G.success : G.accent, color: '#fff',
              border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, fontFamily: GFF,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s',
            }}>
              {copied ? <><VI.check size={12} w={2.4}/> Copiado</> : 'Copiar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={handleWhatsApp} style={{
              flex: 1, padding: '11px 0', background: G.whatsapp, color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500,
              fontFamily: GFF, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <WhatsAppSVG/> WhatsApp
            </button>
            <button onClick={handleShare} style={{
              padding: '11px 14px', background: G.surfaceHi, color: G.text,
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500,
              fontFamily: GFF, cursor: 'pointer',
            }}>Más opciones</button>
          </div>
        </GCard>
      )}

      {/* Prize progress */}
      {prizeEvery > 0 && (
        <GCard style={{ marginTop: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Premio del mes</div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, marginTop: 4 }}>Premio a los {prizeEvery} referidos</div>
              <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>
                Llevás <strong style={{ color: G.text }}>{referrals.length}</strong> · te faltan <strong style={{ color: G.text }}>{Math.max(0, prizeEvery - referrals.length)}</strong>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: G.accentSoft, color: G.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VI.gift size={20} w={1.8}/>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
            {Array.from({ length: prizeEvery }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < referrals.length ? G.accent : G.surfaceHi }}/>
            ))}
          </div>
        </GCard>
      )}

      {/* Referred list */}
      {referrals.length > 0 && (
        <>
          <GSection right={<span style={{ fontSize: 13, color: G.muted }}>{referrals.length} activos</span>}>Tus referidos</GSection>
          <GCard style={{ padding: 0, overflow: 'hidden' }}>
            {referrals.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderBottom: i < referrals.length - 1 ? `0.5px solid ${G.hairline}` : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: G.surfaceHi, color: G.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                  {(r.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.1 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>{r.city || ''}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: G.success, fontVariantNumeric: 'tabular-nums' }}>+{fmt(referrerReward)}</span>
              </div>
            ))}
          </GCard>
        </>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function ClientPortalApp({ client, config }) {
  const [tab, setTab] = React.useState('home');

  const showStore = !!config.storeEnabled;
  const showReferrals = !!config.referralsEnabled;

  const handleTab = (t) => {
    window.scrollTo(0, 0);
    setTab(t);
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: G.bg, color: G.text, fontFamily: GFF,
      maxWidth: 480, margin: '0 auto', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { background: ${G.bg}; }
        ::-webkit-scrollbar { display: none; }
        input[type=range] { accent-color: ${G.accent}; }
        textarea { font-family: ${GFF}; }
        button { font-family: ${GFF}; }
        @keyframes gFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'gFade .26s ease' }} key={tab}>
        {tab === 'home'      && <PortalHome      client={client} config={config} onTab={handleTab}/>}
        {tab === 'order'     && <PortalOrder     client={client} config={config} onDone={() => handleTab('orders')}/>}
        {tab === 'orders'    && <PortalOrders    client={client} config={config} onTab={handleTab}/>}
        {tab === 'store'     && showStore && <PortalStore client={client} config={config} onTab={handleTab}/>}
        {tab === 'invoices'  && <PortalInvoices  client={client} config={config} onTab={handleTab}/>}
        {tab === 'referrals' && showReferrals && <PortalReferrals client={client} config={config} onTab={handleTab}/>}
      </div>

      <GTabBar tab={tab} onTab={handleTab} showStore={showStore} showReferrals={showReferrals}/>
    </div>
  );
}

// ─── Root (token auth) ────────────────────────────────────────────────────────

function ClientPortalPage() {
  const [state, setState] = React.useState('loading');
  const [client, setClient] = React.useState(null);
  const [config, setConfig] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || localStorage.getItem('nativa_client_token');
    if (!token) { setState('error'); setError('Acceso inválido. Usá el link personalizado que te enviamos.'); return; }
    localStorage.setItem('nativa_client_token', token);
    Promise.all([DataService.getClientByToken(token), DataService.getConfig()])
      .then(([cl, cfg]) => {
        if (!cl) { setState('error'); setError('El link no es válido o expiró.'); return; }
        setClient(cl); setConfig(cfg); setState('ready');
      })
      .catch(err => { setState('error'); setError('Error de conexión. Intentá de nuevo.'); });
  }, []);

  if (state === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: GFF, background: G.bg, color: G.text, gap: 16 }}>
        <div style={{ color: G.accent }}><VI.drop size={40} w={1.6} filled/></div>
        <div style={{ fontSize: 14, color: G.muted, fontWeight: 500 }}>Cargando tu portal...</div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: GFF, background: G.bg, color: G.text, padding: 32, textAlign: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: G.surfaceHi, color: G.dim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VI.drop size={24} w={2}/>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>Sin acceso</div>
          <div style={{ fontSize: 14, color: G.muted, marginTop: 8, maxWidth: 280, lineHeight: 1.5 }}>{error}</div>
        </div>
      </div>
    );
  }

  return <ClientPortalApp client={client} config={config}/>;
}

// ─── Mount ────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(ClientPortalPage)
);
