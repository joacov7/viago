// NATIVA Viago — Portal del cliente · Glaciar v2
// Diseño: viago/design_handoff_viago_glaciar
// Lógica: Supabase + DataService + token-based auth (sin cambios)

// ─── Tokens ───────────────────────────────────────────────────────────────────

const G = {
  bg:          '#F2F0EB',
  surface:     '#FAF8F4',
  surfaceHi:   '#E8E4DC',
  text:        '#0D1B2A',
  muted:       'rgba(13,27,42,0.62)',
  dim:         'rgba(13,27,42,0.40)',
  hairline:    'rgba(13,27,42,0.10)',
  accent:      '#0D1B2A',
  accentDeep:  '#0D1B2A',
  accentSoft:  'rgba(13,27,42,0.06)',
  whatsapp:    '#25D366',
  success:     '#1A6B3F',
  successSoft: 'rgba(26,107,63,0.10)',
  warning:     '#A66400',
  warningSoft: 'rgba(166,100,0,0.10)',
  danger:      '#A11C26',
  dangerSoft:  'rgba(161,28,38,0.08)',
};

const GFF = 'Montserrat, -apple-system, "SF Pro Display", "Helvetica Neue", Inter, system-ui, sans-serif';

const fmt = (n) => DataService.formatCurrency
  ? DataService.formatCurrency(n)
  : ('$' + (n || 0).toLocaleString('es-AR'));

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
  bidon: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="15" rx="2"/><path d="M9 3h6v3H9z"/><path d="M6 13h12"/>
    </svg>
  ),
  truck: ({ size = 24, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/>
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
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
  chevron: ({ size = 14, w = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6"/>
    </svg>
  ),
  recycle: ({ size = 20, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 19H4.8a1.6 1.6 0 0 1-1.4-2.4l1.5-2.6"/><path d="M11 19h8.7a1.6 1.6 0 0 0 1.4-2.4l-1.9-3.3"/>
      <path d="M16.5 9.5l2.4-1.4a1.6 1.6 0 0 0 .6-2.2l-1.5-2.6a1.6 1.6 0 0 0-2.2-.5l-2.4 1.4"/>
      <path d="M10 4l-2.8 4.8M7.2 8.8L4.4 13"/><path d="M16.5 9.5l-2.8-4.8"/>
    </svg>
  ),
  share: ({ size = 18, w = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  ),
};

// ─── Logo ─────────────────────────────────────────────────────────────────────

function NativaLogoMark({ size = 48, color, strokeWidth = 1.6 }) {
  const c = color || G.text;
  return (
    <svg width={size * 0.83} height={size} viewBox="0 0 100 120" fill="none"
      stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M 50 8 C 38 26,26 44,18 60 C 12 72,12 86,18 96 C 25 108,39 113,50 113 C 61 113,75 108,82 96 C 88 86,88 72,82 60 C 74 44,62 26,50 8 Z"/>
      <path d="M 25 84 L 38 64 L 47 74 L 60 56 L 75 84 Z"/>
      <path d="M 23 96 C 28 93,33 93,38 96 C 43 99,48 99,53 96 C 58 93,63 93,68 96 C 72 98,75 98,77 96" strokeWidth={strokeWidth * 0.85}/>
      <path d="M 28 104 C 32 101.5,36 101.5,40 104 C 44 106.5,48 106.5,52 104 C 56 101.5,60 101.5,64 104 C 67 105.5,70 105.5,72 104" strokeWidth={strokeWidth * 0.85}/>
    </svg>
  );
}

function NativaWordmarkCompact({ color, size = 1 }) {
  const c = color || G.text;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 * size, color: c, fontFamily: GFF }}>
      <NativaLogoMark size={28 * size} color={c} strokeWidth={1.7}/>
      <div style={{ fontSize: 16 * size, fontWeight: 600, letterSpacing: '0.22em', lineHeight: 1, paddingLeft: '0.22em' }}>NATIVA</div>
    </div>
  );
}

function NativaLogoLockup({ color, size = 1, tagline = 'AGUA DE ORIGEN NATURAL', subline }) {
  const c = color || G.text;
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 16 * size, color: c, fontFamily: GFF }}>
      <NativaLogoMark size={72 * size} color={c} strokeWidth={1.4}/>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 * size }}>
        <div style={{ fontSize: 30 * size, fontWeight: 600, letterSpacing: '0.32em', lineHeight: 1, paddingLeft: '0.32em' }}>NATIVA</div>
        {tagline && <div style={{ fontSize: 8.5 * size, fontWeight: 300, letterSpacing: '0.38em', opacity: 0.72, paddingLeft: '0.38em' }}>{tagline}</div>}
        {subline && <>
          <div style={{ height: 1, width: 36 * size, background: 'currentColor', opacity: 0.28, marginTop: 12 * size }}/>
          <div style={{ fontSize: 9 * size, fontWeight: 300, letterSpacing: '0.42em', opacity: 0.55, paddingLeft: '0.42em', marginTop: 4 * size }}>{subline}</div>
        </>}
      </div>
    </div>
  );
}

// ─── ProductArt ───────────────────────────────────────────────────────────────

function ProductArt({ type = 'bidon', imageUrl, size = 60, color, label = true }) {
  const fg = color || G.text;
  if (imageUrl) {
    return (
      <div style={{ width: size, aspectRatio: '1', background: G.surfaceHi, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img src={imageUrl} alt="" style={{ width: '88%', height: '88%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }}/>
      </div>
    );
  }
  if (type === 'bidon') return (
    <svg width={size * 0.55} height={size * 0.85} viewBox="0 0 60 90" fill="none">
      <rect x="10" y="14" width="40" height="70" rx="4" stroke={fg} strokeWidth="1.4" fill={G.surface}/>
      <rect x="18" y="6" width="24" height="10" rx="2" stroke={fg} strokeWidth="1.4" fill={G.surface}/>
      <rect x="20" y="2" width="20" height="6" rx="1" fill={fg}/>
      <path d="M10 36 Q20 33 30 36 T50 36 L50 84 Q50 88 46 88 L14 88 Q10 88 10 84 Z" fill={fg} opacity="0.06"/>
      {label && <>
        <rect x="10" y="42" width="40" height="22" fill={G.bg} opacity="0.9"/>
        <text x="30" y="55" fontFamily="Montserrat,sans-serif" fontSize="6" fill={fg} textAnchor="middle" fontWeight="600" letterSpacing="1.5">NATIVA</text>
        <line x1="18" y1="58" x2="42" y2="58" stroke={fg} strokeWidth="0.4" opacity="0.4"/>
        <text x="30" y="62" fontFamily="Montserrat,sans-serif" fontSize="2.6" fill={fg} textAnchor="middle" fontWeight="300" opacity="0.6">20L · ORIGEN NATURAL</text>
      </>}
    </svg>
  );
  if (type === 'botella') return (
    <svg width={size * 0.45} height={size * 0.85} viewBox="0 0 50 90" fill="none">
      <rect x="18" y="2" width="14" height="6" rx="1" fill={fg}/>
      <path d="M19 8 L19 22 Q19 26 17 30 L15 36 Q13 40 13 44 L13 80 Q13 86 19 86 L31 86 Q37 86 37 80 L37 44 Q37 40 35 36 L33 30 Q31 26 31 22 L31 8 Z" stroke={fg} strokeWidth="1.2" fill={G.surface}/>
      {label && <>
        <rect x="13" y="56" width="24" height="20" fill={G.bg} opacity="0.92"/>
        <text x="25" y="67" fontFamily="Montserrat,sans-serif" fontSize="4.5" fill={fg} textAnchor="middle" fontWeight="600" letterSpacing="1">NATIVA</text>
      </>}
    </svg>
  );
  if (type === 'sifon') return (
    <svg width={size * 0.5} height={size * 0.85} viewBox="0 0 50 90" fill="none">
      <rect x="15" y="2" width="20" height="8" rx="1.5" fill={fg}/>
      <rect x="22" y="10" width="6" height="6" fill={fg}/>
      <path d="M10 16 L10 84 Q10 86 12 86 L38 86 Q40 86 40 84 L40 16 Z" stroke={fg} strokeWidth="1.2" fill={G.surface}/>
      {label && <>
        <rect x="10" y="48" width="30" height="22" fill={G.bg} opacity="0.92"/>
        <text x="25" y="59" fontFamily="Montserrat,sans-serif" fontSize="4.8" fill={fg} textAnchor="middle" fontWeight="600" letterSpacing="1">NATIVA</text>
      </>}
    </svg>
  );
  return <VI.bidon size={size * 0.5} w={1.6}/>;
}

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
    neutral: { bg: G.surfaceHi,   fg: G.muted },
    success: { bg: G.successSoft, fg: G.success },
    warning: { bg: G.warningSoft, fg: G.warning },
    danger:  { bg: G.dangerSoft,  fg: G.danger },
    accent:  { bg: G.accentSoft,  fg: G.accentDeep },
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
        width: 32, height: 32, borderRadius: 9, background: G.surfaceHi, border: 'none',
        color: value === 0 ? G.dim : G.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: value === 0 ? 'default' : 'pointer',
      }}><VI.minus size={14} w={2.4}/></button>
      <span style={{ width: 22, textAlign: 'center', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: value > 0 ? G.text : G.dim }}>{value}</span>
      <button onClick={() => onChange(value + 1)} style={{
        width: 32, height: 32, borderRadius: 9, background: G.accent, color: '#fff', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}><VI.plus size={14} w={2.4}/></button>
    </div>
  );
}

function SuccessScene({ title, sub, extra }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: G.bg, padding: 32, textAlign: 'center',
    }}>
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

// GShell: full-screen container with sticky header, scroll area, floating bar slot, internal tab bar
function GShell({ title, eyebrow, avatarInitial = '?', onAvatarClick, showAvatar = true, rightAccessory, activeTab, onTab, children, floatingBar, floatingBarBottom = 80 }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: G.bg, color: G.text, fontFamily: GFF, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, padding: '6px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 2 }}>{eyebrow}</div>}
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {rightAccessory}
          {showAvatar && (
            <button onClick={onAvatarClick} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: G.text, color: G.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, letterSpacing: 0.4,
              border: 'none', cursor: onAvatarClick ? 'pointer' : 'default', fontFamily: GFF,
            }}>{avatarInitial}</button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 100px' }}>
        {children}
      </div>
      {floatingBar && (
        <div style={{ position: 'absolute', bottom: floatingBarBottom, left: 0, right: 0, padding: '0 12px', zIndex: 10 }}>
          {floatingBar}
        </div>
      )}
      <GTabBar tab={activeTab} onTab={onTab}/>
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function GTabBar({ tab, onTab }) {
  const tabs = [
    { id: 'home',      label: 'Inicio',   ico: 'home' },
    { id: 'order',     label: 'Pedir',    ico: 'drop' },
    { id: 'orders',    label: 'Pedidos',  ico: 'bidon' },
    { id: 'store',     label: 'Tienda',   ico: 'bag' },
    { id: 'referrals', label: 'Amigos',   ico: 'gift' },
    { id: 'invoices',  label: 'Facturas', ico: 'receipt' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(242,240,235,0.92)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: `0.5px solid ${G.hairline}`,
      display: 'flex', padding: '8px 0 24px',
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => onTab && onTab(t.id)} style={{
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

function PortalHome({ client, config, onTab, onAvatarClick }) {
  const [products, setProducts] = React.useState([]);
  const [orders, setOrders] = React.useState([]);

  React.useEffect(() => {
    Promise.all([
      DataService.getProducts(),
      DataService.getClientOrders(client.id),
    ]).then(([prods, ords]) => {
      setProducts(prods.slice(0, 4));
      setOrders(ords);
    });
  }, [client.id]);

  const nextOrder = orders.find(o => o.status === 'pendiente' || o.status === 'en_camino');
  const recentActivity = orders.slice(0, 3);
  const pts = client.points || 0;
  const ptsForReward = config.pointsForReward || 100;
  const segCount = 10;
  const segsOn = ptsForReward > 0 ? Math.round(Math.min(pts / ptsForReward, 1) * segCount) : 0;
  const initial = (client.name || '?')[0].toUpperCase();

  const STATUS_MAP = {
    pendiente: { label: 'Pendiente', kind: 'warning' },
    en_camino: { label: 'En camino', kind: 'accent' },
    entregado: { label: 'Entregado', kind: 'success' },
    cancelado: { label: 'Cancelado', kind: 'danger' },
  };

  const artForProduct = (p) => {
    const n = (p.name || '').toLowerCase();
    if (n.includes('sifon') || n.includes('soda')) return 'sifon';
    if (n.includes('botella')) return 'botella';
    return 'bidon';
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: G.bg, color: G.text, fontFamily: GFF, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '8px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <NativaWordmarkCompact/>
        <button onClick={onAvatarClick} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: G.text, color: G.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: GFF,
        }}>{initial}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 100px' }}>
        {/* Greeting */}
        <div style={{ padding: '8px 4px 14px' }}>
          <div style={{ fontSize: 13, color: G.muted, fontWeight: 500 }}>Hola, {client.name?.split(' ')[0] || 'cliente'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>{config.tagline || 'Tu agua, en orden.'}</div>
        </div>

        {/* Hero */}
        <div style={{ background: `linear-gradient(170deg,${G.accentDeep} 0%,#0A2433 100%)`, color: '#fff', borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.18, color: '#fff' }}>
            <VI.drop size={180} w={0} filled/>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.7 }}>
              {nextOrder ? 'Próxima entrega' : 'Tu pedido'}
            </div>
            {nextOrder ? (<>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, marginTop: 6 }}>
                {nextOrder.deliveryDate ? DataService.formatDate(nextOrder.deliveryDate) : 'Pendiente'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                {nextOrder.items?.length ? `${nextOrder.items.reduce((s, i) => s + (i.quantity || 1), 0)} unidades` : ''} · {fmt(nextOrder.total)}
              </div>
            </>) : (<>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, marginTop: 6, lineHeight: 1.15 }}>
                Pedí cuando<br/>quieras
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Agua de vertiente a tu puerta.</div>
            </>)}
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button onClick={() => onTab('order')} style={{
                flex: 1, padding: '12px 14px', background: '#fff', color: G.text, border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 600, letterSpacing: -0.2, fontFamily: GFF, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}><VI.drop size={14} w={2} filled/> Pedir ahora</button>
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
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{fmt(client.balance || 0)}</div>
            <div style={{ fontSize: 11, color: G.dim, marginTop: 2 }}>{(client.balance || 0) <= 0 ? 'al día' : 'pendiente'}</div>
          </GCard>
          <GCard style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: G.muted }}>
              <VI.bidon size={14} w={2}/>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Pedidos</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{orders.filter(o => o.status === 'entregado').length}</div>
            <div style={{ fontSize: 11, color: G.dim, marginTop: 2 }}>entregados</div>
          </GCard>
        </div>

        {/* Loyalty */}
        {(pts > 0 || ptsForReward > 0) && (
          <GCard style={{ padding: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: G.muted }}>
              <VI.star size={14} w={2}/>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Puntos Glaciar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{pts}</span>
              <span style={{ fontSize: 13, color: G.muted, fontWeight: 500 }}>/ {ptsForReward}</span>
            </div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{Math.max(0, ptsForReward - pts)} pts para tu próximo premio</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
              {Array.from({ length: segCount }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < segsOn ? G.accent : G.surfaceHi }}/>
              ))}
            </div>
          </GCard>
        )}

        {/* Streaks */}
        {config.streaksEnabled && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            {[
              { label: 'Pedidos\nseguidos', val: client.orderStreak || 0, every: config.streakOrderRewardEvery || 0 },
              { label: 'Bidones\ndevueltos', val: client.containerStreak || 0, every: config.streakContainerRewardEvery || 0 },
              { label: 'Pagos\nal día', val: client.payStreak || 0, every: config.streakPayRewardEvery || 0 },
            ].map((s, idx) => (
              <GCard key={idx} style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.7, fontVariantNumeric: 'tabular-nums' }}>{s.val}</span>
                  {s.every > 0 && <span style={{ fontSize: 11, color: G.muted }}>/ {s.every}</span>}
                </div>
                <div style={{ fontSize: 10, fontWeight: 500, color: G.muted, marginTop: 6, lineHeight: 1.25, whiteSpace: 'pre-line' }}>{s.label}</div>
                {s.every > 0 && (
                  <div style={{ height: 3, background: G.surfaceHi, borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: Math.min(100, Math.round(s.val / s.every * 100)) + '%', height: '100%', background: G.accent, borderRadius: 999 }}/>
                  </div>
                )}
              </GCard>
            ))}
          </div>
        )}

        {/* Products carousel */}
        {products.length > 0 && (<>
          <GSection right={
            config.storeEnabled
              ? <span onClick={() => onTab('store')} style={{ fontSize: 13, color: G.accent, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Catálogo <VI.arrowUpRight size={12} w={2.2}/>
                </span>
              : null
          }>Productos</GSection>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {products.map((p, i) => (
              <button key={p.id} onClick={() => onTab('order')} style={{
                flexShrink: 0, width: 152,
                background: i === 0 ? G.accent : G.surface,
                color: i === 0 ? '#fff' : G.text,
                border: i === 0 ? 'none' : `0.5px solid ${G.hairline}`,
                borderRadius: 16, padding: 14,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: 196, cursor: 'pointer', fontFamily: GFF, textAlign: 'left',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 4px', color: i === 0 ? '#fff' : G.text }}>
                  <ProductArt type={artForProduct(p)} size={88} color={i === 0 ? '#fff' : G.text}/>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, opacity: i === 0 ? 0.7 : 0.55, marginTop: 2 }}>{p.unit || ''}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </>)}

        {/* Referrals CTA */}
        {config.referralsEnabled && (<>
          <GSection>Referidos</GSection>
          <GCard style={{ padding: 16 }} onClick={() => onTab('referrals')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: G.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <VI.gift size={20} w={1.8}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>Invitá y ganan los dos</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Compartí tu código y sumá crédito</div>
              </div>
              <VI.arrowRight size={16} w={2}/>
            </div>
          </GCard>
        </>)}

        {/* Recent activity */}
        {recentActivity.length > 0 && (<>
          <GSection right={
            <span onClick={() => onTab('orders')} style={{ fontSize: 13, color: G.accent, fontWeight: 500, cursor: 'pointer' }}>Ver todo</span>
          }>Actividad</GSection>
          <GCard style={{ padding: 0, overflow: 'hidden' }}>
            {recentActivity.map((o, i, arr) => {
              const s = STATUS_MAP[o.status] || STATUS_MAP.pendiente;
              const icoName = o.status === 'entregado' ? 'truck' : 'bidon';
              return (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length - 1 ? `0.5px solid ${G.hairline}` : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: G.surfaceHi, color: G.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {React.createElement(VI[icoName], { size: 16, w: 2 })}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.1 }}>
                      {o.items?.length ? `${o.items.reduce((s, x) => s + (x.quantity || 1), 0)} unidades` : 'Pedido'} · {fmt(o.total)}
                    </div>
                    <div style={{ fontSize: 11, color: G.muted, marginTop: 1 }}>{o.deliveryDate ? DataService.formatDate(o.deliveryDate) : ''}</div>
                  </div>
                  <GPill label={s.label} kind={s.kind}/>
                </div>
              );
            })}
          </GCard>
        </>)}

        {/* Brand footer */}
        <div style={{ marginTop: 22, padding: '22px 18px', background: G.surface, border: `0.5px solid ${G.hairline}`, borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <NativaLogoMark size={36} strokeWidth={1.4}/>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.4 }}>Volvé a lo natural.</div>
          <div style={{ fontSize: 12, color: G.muted, lineHeight: 1.45, maxWidth: 240 }}>Agua de origen natural, entregada directo a tu casa.</div>
        </div>
      </div>
      <GTabBar tab="home" onTab={onTab}/>
    </div>
  );
}

// ─── Pedir ────────────────────────────────────────────────────────────────────

function PortalOrder({ client, config, onDone, onTab, onAvatarClick }) {
  const [products, setProducts] = React.useState([]);
  const [qtys, setQtys] = React.useState({});
  const [dates, setDates] = React.useState([]);
  const [selDate, setSelDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const initial = (client.name || '?')[0].toUpperCase();

  React.useEffect(() => {
    DataService.getProducts().then(prods => {
      setProducts(prods);
      const init = {};
      prods.forEach(p => { init[p.id] = 0; });
      setQtys(init);
    });
    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
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
    productId: p.id, productName: p.name, quantity: qtys[p.id], price: p.price, subtotal: p.price * qtys[p.id],
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

  const artForProduct = (p) => {
    const n = (p.name || '').toLowerCase();
    if (n.includes('sifon') || n.includes('soda')) return 'sifon';
    if (n.includes('botella')) return 'botella';
    return 'bidon';
  };

  if (success) return (
    <div style={{ width: '100%', height: '100%', background: G.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: G.successSoft, color: G.success, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, animation: 'gPop .4s cubic-bezier(.34,1.56,.64,1)' }}>
        <VI.check size={42} w={2.4}/>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8 }}>Pedido enviado</div>
      <div style={{ fontSize: 14, color: G.muted, marginTop: 8, maxWidth: 280, lineHeight: 1.4 }}>Te avisamos por WhatsApp cuando salga el camión.</div>
    </div>
  );

  const confirmBar = (
    <div style={{ background: G.text, color: G.bg, borderRadius: 18, padding: 16 }}>
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
  );

  return (
    <GShell title="Pedir" eyebrow="Nuevo pedido" avatarInitial={initial} onAvatarClick={onAvatarClick}
      activeTab="order" onTab={onTab} floatingBar={confirmBar}>
      <GCard style={{ padding: 0, overflow: 'hidden' }}>
        {products.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: G.dim, fontSize: 14 }}>Cargando...</div>
        ) : products.map((p, i, arr) => {
          const q = qtys[p.id] || 0;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderBottom: i < arr.length - 1 ? `0.5px solid ${G.hairline}` : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: q > 0 ? G.accentSoft : G.surfaceHi, color: G.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ProductArt type={artForProduct(p)} size={44} color={G.text} label={false}/>
              </div>
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
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Dirección</div>
          <div style={{ fontSize: 13, color: G.text }}>{client.address || 'Sin dirección registrada'}</div>
          {client.city && <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{client.city}</div>}
        </div>
      </GCard>

      <GSection>Notas (opcional)</GSection>
      <GCard style={{ padding: 0 }}>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Tocá timbre dos veces, dejar en portería..."
          rows={3}
          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: G.text, padding: '12px 14px', resize: 'none', fontFamily: GFF, fontSize: 14, boxSizing: 'border-box' }}/>
      </GCard>
    </GShell>
  );
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

function PortalOrders({ client, config, onTab, onAvatarClick }) {
  const [orders, setOrders] = React.useState([]);
  const [filter, setFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const initial = (client.name || '?')[0].toUpperCase();

  React.useEffect(() => {
    DataService.getClientOrders(client.id).then(ords => { setOrders(ords); setLoading(false); });
  }, [client.id]);

  const STATUS = {
    pendiente: { label: 'Pendiente', kind: 'warning' },
    en_camino: { label: 'En camino', kind: 'accent' },
    entregado: { label: 'Entregado', kind: 'success' },
    cancelado: { label: 'Cancelado', kind: 'danger' },
  };

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthOrders = orders.filter(o => (o.deliveryDate || o.createdAt || '').startsWith(thisMonth));
  const monthSpend = monthOrders.filter(o => o.status === 'entregado').reduce((s, o) => s + (o.total || 0), 0);

  const FILTERS = [
    { id: 'all',       label: 'Todos',      count: orders.length },
    { id: 'en_camino', label: 'En camino',  count: orders.filter(o => o.status === 'en_camino').length },
    { id: 'entregado', label: 'Entregados', count: orders.filter(o => o.status === 'entregado').length },
    { id: 'cancelado', label: 'Cancelados', count: orders.filter(o => o.status === 'cancelado').length },
  ];

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <GShell title="Pedidos" eyebrow="Tu historial" avatarInitial={initial} onAvatarClick={onAvatarClick}
      activeTab="orders" onTab={onTab}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { label: 'Este mes', val: monthOrders.length, sub: 'pedidos' },
          { label: 'Gasto', val: fmt(monthSpend), sub: 'últimos 30 días' },
          { label: 'Total', val: orders.filter(o => o.status === 'entregado').length, sub: 'entregados', green: true },
        ].map(s => (
          <GCard key={s.label} style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.6, marginTop: 6, fontVariantNumeric: 'tabular-nums', color: s.green ? G.success : G.text }}>{s.val}</div>
            <div style={{ fontSize: 11, color: G.dim, marginTop: 2 }}>{s.sub}</div>
          </GCard>
        ))}
      </div>

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
            <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>{f.count}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: G.dim }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 16px', textAlign: 'center', color: G.muted }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: G.surfaceHi, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <NativaLogoMark size={36} color={G.dim} strokeWidth={1.5}/>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: G.text }}>Sin pedidos todavía</div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 6, lineHeight: 1.45 }}>Tus pedidos aparecerán acá.</div>
          </div>
        ) : filtered.map(o => {
          const s = STATUS[o.status] || STATUS.pendiente;
          const itemLabel = o.items?.map(i => `${i.quantity || 1}× ${i.productName || 'Producto'}`).join(' · ') || '';
          return (
            <GCard key={o.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>#{o.id}</span>
                    <span style={{ fontSize: 12, color: G.muted }}>{o.deliveryDate ? DataService.formatDate(o.deliveryDate) : ''}</span>
                  </div>
                  <div style={{ fontSize: 13, color: G.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemLabel}</div>
                </div>
                <GPill label={s.label} kind={s.kind}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `0.5px solid ${G.hairline}` }}>
                <span style={{ fontSize: 12, color: G.muted }}>{o.notes && o.notes !== 'Generado automáticamente' ? o.notes : ''}</span>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>{fmt(o.total)}</span>
              </div>
              {o.status === 'en_camino' && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: G.accentSoft, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <VI.truck size={18} w={2}/>
                  <div style={{ flex: 1, fontSize: 12, color: G.accentDeep, fontWeight: 500 }}>Tu pedido está en camino</div>
                </div>
              )}
            </GCard>
          );
        })}
      </div>
    </GShell>
  );
}

// ─── Tienda ───────────────────────────────────────────────────────────────────

function PortalStore({ client, config, onTab, onAvatarClick }) {
  const [products, setProducts] = React.useState([]);
  const [cat, setCat] = React.useState('all');
  const [cart, setCart] = React.useState({});
  const [screen, setScreen] = React.useState('browse');
  const [payMode, setPayMode] = React.useState('cash');
  const [pointsUsed, setPointsUsed] = React.useState(0);
  const [success, setSuccess] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const initial = (client.name || '?')[0].toUpperCase();

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

  const artForProduct = (p) => {
    const n = (p.name || '').toLowerCase();
    if (n.includes('sifon') || n.includes('soda')) return 'sifon';
    if (n.includes('botella')) return 'botella';
    return 'bidon';
  };

  if (success) return (
    <div style={{ width: '100%', height: '100%', background: G.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: G.successSoft, color: G.success, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, animation: 'gPop .4s cubic-bezier(.34,1.56,.64,1)' }}>
        <VI.check size={42} w={2.4}/>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8 }}>Pedido enviado</div>
      <div style={{ fontSize: 14, color: G.muted, marginTop: 8, maxWidth: 280, lineHeight: 1.4 }}>Te avisamos cuando salga el camión.</div>
      {pointsUsed > 0 && (
        <div style={{ marginTop: 20, padding: '10px 18px', background: G.accentSoft, color: G.accentDeep, borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
          -{pointsUsed} puntos canjeados
        </div>
      )}
    </div>
  );

  if (screen === 'checkout') {
    const confirmBtn = (
      <button onClick={handleConfirm} disabled={saving} style={{
        width: '100%', padding: '15px', background: G.accent, color: '#fff', border: 'none',
        borderRadius: 14, fontSize: 15, fontWeight: 600, letterSpacing: -0.2, fontFamily: GFF,
        cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <VI.check size={16} w={2.4}/>{saving ? 'Procesando...' : 'Confirmar'}
      </button>
    );
    return (
      <GShell title="Confirmar" eyebrow="Resumen del pedido" showAvatar={false}
        rightAccessory={<button onClick={() => setScreen('browse')} style={{ width: 36, height: 36, borderRadius: '50%', background: G.surfaceHi, border: 'none', color: G.text, fontSize: 16, cursor: 'pointer' }}>✕</button>}
        activeTab="store" onTab={onTab} floatingBar={confirmBtn} floatingBarBottom={90}>

        <GCard style={{ padding: 0, overflow: 'hidden' }}>
          {cartItems.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < cartItems.length - 1 ? `0.5px solid ${G.hairline}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: G.surfaceHi, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProductArt type={artForProduct(p)} size={32} color={G.text} label={false}/>
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
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500, fontFamily: GFF,
              cursor: m.disabled ? 'default' : 'pointer', opacity: m.disabled ? 0.4 : 1,
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
          </GCard>
        )}

        <GCard style={{ marginTop: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: G.muted }}>
            <span>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCash)}</span>
          </div>
          {pointsUsed > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: G.accent, marginTop: 6, fontWeight: 500 }}>
              <span>- {pointsUsed} puntos</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>-{fmt(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${G.hairline}` }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{fmt(finalTotal)}</span>
          </div>
        </GCard>
      </GShell>
    );
  }

  const cartBtn = cartCount > 0 ? (
    <button onClick={() => setScreen('checkout')} style={{
      width: '100%', padding: '13px 18px', background: G.accent, color: '#fff', border: 'none',
      borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: GFF, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{cartCount}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>Ver carrito</span>
      <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCash)}</span>
      <VI.arrowRight size={14} w={2.4}/>
    </button>
  ) : null;

  return (
    <GShell title="Tienda" eyebrow="Productos y canje" avatarInitial={initial} onAvatarClick={onAvatarClick}
      activeTab="store" onTab={onTab} floatingBar={cartBtn} floatingBarBottom={90}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        {filtered.map(p => {
          const q = cart[p.id] || 0;
          return (
            <GCard key={p.id} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: '100%', aspectRatio: '1', maxHeight: 100, borderRadius: 10, background: G.surfaceHi, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.text }}>
                <ProductArt type={artForProduct(p)} size={88} color={G.text} label/>
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
    </GShell>
  );
}

// ─── Facturas ─────────────────────────────────────────────────────────────────

function PortalInvoices({ client, config, onTab, onAvatarClick }) {
  const [invoices, setInvoices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const initial = (client.name || '?')[0].toUpperCase();

  React.useEffect(() => {
    DataService.getClientInvoices(client.id).then(invs => { setInvoices(invs); setLoading(false); });
  }, [client.id]);

  const totalAmt = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const pendingAmt = invoices.filter(i => i.paymentStatus !== 'pagado').reduce((s, i) => s + (i.total || 0), 0);
  const METHOD_LABEL = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'MercadoPago', cuenta_corriente: 'Cta. corriente' };

  return (
    <GShell title="Facturas" eyebrow="Tu cuenta" avatarInitial={initial} onAvatarClick={onAvatarClick}
      activeTab="invoices" onTab={onTab}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <GCard style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Histórico</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalAmt)}</div>
          <div style={{ fontSize: 11, color: G.dim, marginTop: 4 }}>{invoices.length} facturas</div>
        </GCard>
        <GCard style={{ padding: 16, background: pendingAmt > 0 ? G.warningSoft : G.successSoft, borderColor: pendingAmt > 0 ? 'rgba(166,100,0,0.18)' : 'rgba(26,107,63,0.18)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: pendingAmt > 0 ? G.warning : G.success, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {pendingAmt > 0 ? 'Pendiente' : 'Al día'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 8, color: pendingAmt > 0 ? G.warning : G.success, fontVariantNumeric: 'tabular-nums' }}>
            {pendingAmt > 0 ? fmt(pendingAmt) : '$0'}
          </div>
          {pendingAmt > 0 ? (
            <div style={{ fontSize: 11, color: G.warning, marginTop: 4, fontWeight: 500 }}>Contactá a NATIVA</div>
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
                    <span style={{ fontSize: 12, color: G.muted }}>{inv.createdAt ? DataService.formatDate(inv.createdAt.split('T')[0]) : ''}</span>
                  </div>
                  <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{METHOD_LABEL[inv.paymentMethod] || inv.paymentMethod || '—'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>{fmt(inv.total)}</div>
                  <div style={{ marginTop: 4 }}>
                    <GPill label={inv.paymentStatus === 'pagado' ? 'Pagada' : 'Pendiente'} kind={inv.paymentStatus === 'pagado' ? 'success' : 'warning'}/>
                  </div>
                </div>
              </div>
            </GCard>
          ))}
        </div>
      )}
    </GShell>
  );
}

// ─── Referidos ────────────────────────────────────────────────────────────────

function PortalReferrals({ client, config, onTab, onAvatarClick }) {
  const [copied, setCopied] = React.useState(false);
  const [referrals, setReferrals] = React.useState([]);
  const initial = (client.name || '?')[0].toUpperCase();

  React.useEffect(() => {
    DataService.getClients().then(cls => {
      setReferrals(cls.filter(c => c.referredBy === client.id));
    });
  }, [client.id]);

  const code = client.referralCode || '';
  const link = code
    ? `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}client.html?ref=${code}`
    : '';
  const prizeEvery = config.referralPrizeEvery || 5;
  const referrerReward = config.referralReferrerReward || config.referralBonus || 500;
  const referredDiscount = config.referralReferredDiscount || 10;
  const shareMsg = (config.referralShareMessage || 'Hola! Usá mi código {codigo} y conseguís {desc}% off. {link}')
    .replace('{nombre}', client.name?.split(' ')[0] || client.name || '')
    .replace('{codigo}', code)
    .replace('{desc}', referredDiscount)
    .replace('{link}', link)
    .replace('{empresa}', config.companyName || 'NATIVA');

  const handleCopy = () => {
    navigator.clipboard?.writeText(code || link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const handleWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank');
  const handleShare = () => navigator.share ? navigator.share({ title: config.companyName || 'NATIVA', text: shareMsg, url: link }) : handleCopy();

  return (
    <GShell title="Referidos" eyebrow="Programa Glaciar" avatarInitial={initial} onAvatarClick={onAvatarClick}
      activeTab="referrals" onTab={onTab}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        <GCard style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Para vos</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 6, color: G.success, fontVariantNumeric: 'tabular-nums' }}>{fmt(referrerReward)}</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>crédito por referido</div>
        </GCard>
        <GCard style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Para tu amigo</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{referredDiscount}%</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>off en el primer pedido</div>
        </GCard>
      </div>

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
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500, fontFamily: GFF, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2z"/></svg>
              WhatsApp
            </button>
            <button onClick={handleShare} style={{ padding: '11px 14px', background: G.surfaceHi, color: G.text, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500, fontFamily: GFF, cursor: 'pointer' }}>
              Más
            </button>
          </div>
        </GCard>
      )}

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
            <div style={{ width: 44, height: 44, borderRadius: 12, background: G.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {referrals.length > 0 && (<>
        <GSection right={<span style={{ fontSize: 13, color: G.muted }}>{referrals.length} activos</span>}>Tus referidos</GSection>
        <GCard style={{ padding: 0, overflow: 'hidden' }}>
          {referrals.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < referrals.length - 1 ? `0.5px solid ${G.hairline}` : 'none' }}>
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
      </>)}
    </GShell>
  );
}

// ─── Mi cuenta ────────────────────────────────────────────────────────────────

function PortalAccount({ client, config, onClose, onTab, onClientUpdate }) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');
  const [form, setForm] = React.useState({ name: '', phone: '', address: '' });

  const startEdit = () => {
    setForm({ name: client.name || '', phone: client.phone || '', address: client.address || '' });
    setSaveError('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setSaveError(''); };

  const saveEdit = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setSaveError('');
    try {
      const updated = await DataService.updateClientSelf(client.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      onClientUpdate && onClientUpdate({ ...client, ...updated });
      setEditing(false);
    } catch (e) {
      setSaveError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const fldStyle = { width: '100%', padding: '11px 13px', border: `0.5px solid ${G.hairline}`, borderRadius: 10, background: G.bg, color: G.text, fontFamily: GFF, fontSize: 15, outline: 'none' };

  const initial = (client.name || '?')[0].toUpperCase();
  const pts = client.points || 0;
  const ptsForReward = config.pointsForReward || 100;

  const Row = ({ icoName, title, sub, right, danger, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: G.surfaceHi, color: danger ? G.danger : G.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.createElement(VI[icoName], { size: 16, w: 1.9 })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.1, color: danger ? G.danger : G.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: G.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      {right !== undefined ? right : (onClick ? <VI.chevron size={14} w={2.2}/> : null)}
    </div>
  );

  const Sep = () => <div style={{ height: 0.5, background: G.hairline, marginLeft: 56 }}/>;

  return (
    <GShell
      title="Mi cuenta"
      eyebrow={client.name || ''}
      showAvatar={false}
      rightAccessory={
        editing
          ? <button onClick={cancelEdit} style={{ width: 36, height: 36, borderRadius: '50%', background: G.surfaceHi, border: 'none', color: G.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontFamily: GFF }}>✕</button>
          : <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: G.surfaceHi, border: 'none', color: G.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontFamily: GFF }}>✕</button>
      }
      activeTab="home"
      onTab={onTab}
    >
      {editing ? (
        <>
          {/* Edit form */}
          <GCard style={{ padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre completo</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={fldStyle} placeholder="Tu nombre"/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Teléfono</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={fldStyle} placeholder="+54 9 …"/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Dirección</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={fldStyle} placeholder="Calle y número"/>
              </div>
              {saveError && <div style={{ fontSize: 13, color: G.danger }}>{saveError}</div>}
              <button onClick={saveEdit} disabled={saving || !form.name.trim()} style={{
                marginTop: 4, padding: '13px', width: '100%',
                background: (saving || !form.name.trim()) ? G.surfaceHi : G.text,
                color: (saving || !form.name.trim()) ? G.dim : G.bg,
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                fontFamily: GFF, cursor: saving || !form.name.trim() ? 'default' : 'pointer',
              }}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </GCard>
        </>
      ) : (
        <>
          {/* Profile card */}
          <GCard style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: G.text, color: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, fontFamily: GFF }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>{client.name || '—'}</div>
              {client.phone && <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{client.phone}</div>}
              {client.email && <div style={{ fontSize: 12, color: G.muted }}>{client.email}</div>}
            </div>
            <button onClick={startEdit} style={{ padding: '7px 14px', background: G.surfaceHi, border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, color: G.text, fontFamily: GFF, cursor: 'pointer' }}>
              Editar
            </button>
          </GCard>

          <GSection>Dirección de entrega</GSection>
          <GCard style={{ padding: 0, overflow: 'hidden' }}>
            <Row icoName="home" title={client.address || 'Sin dirección'} sub={client.city || ''} right={null}/>
          </GCard>

          <GSection>NATIVA</GSection>
          <GCard style={{ padding: 0, overflow: 'hidden' }}>
            <Row icoName="star" title="Puntos Glaciar" sub={`${pts} pts · ${Math.max(0, ptsForReward - pts)} para tu próximo premio`} right={null}/>
            {config.referralsEnabled && <><Sep/><Row icoName="gift" title="Referidos" sub={`Código: ${client.referralCode || '—'}`} onClick={() => onTab && onTab('referrals')}/></>}
          </GCard>

          <GSection>Soporte</GSection>
          <GCard style={{ padding: 0, overflow: 'hidden' }}>
            <Row icoName="bell" title="Contactar por WhatsApp" onClick={() => {
              const phone = config.whatsappNumber || '';
              if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
            }}/>
          </GCard>

          <div style={{ marginTop: 18 }}>
            <button onClick={() => {
              localStorage.removeItem('nativa_client_token');
              window.location.reload();
            }} style={{
              width: '100%', padding: '14px', background: 'transparent', color: G.danger,
              border: `0.5px solid ${G.hairline}`, borderRadius: 14, fontSize: 14, fontWeight: 500,
              fontFamily: GFF, cursor: 'pointer',
            }}>Cerrar sesión</button>
          </div>

          <div style={{ marginTop: 32, padding: '20px 0 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <NativaLogoMark size={36} color={G.dim} strokeWidth={1.4}/>
            <div style={{ fontSize: 9, color: G.dim, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase' }}>VOLVÉ A LO NATURAL</div>
            <div style={{ fontSize: 10, color: G.dim, marginTop: 2 }}>v3.0 · Gualeguay, Entre Ríos</div>
          </div>
        </>
      )}
    </GShell>
  );
}

// ─── Registro por referido ────────────────────────────────────────────────────

function ReferralSignup({ refCode }) {
  const [referrer, setReferrer] = React.useState(null);
  const [config, setConfig] = React.useState(null);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phase, setPhase] = React.useState('loading'); // loading | form | saving | done | invalid | error
  const [errMsg, setErrMsg] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      DataService.getClientByReferral(refCode),
      DataService.getConfig(),
    ]).then(([ref, cfg]) => {
      if (!ref) { setPhase('invalid'); return; }
      setReferrer(ref); setConfig(cfg); setPhase('form');
    }).catch(() => setPhase('invalid'));
  }, []);

  const _submitKey = `nativa_ref_submitted_${refCode}`;
  const alreadySubmitted = !!sessionStorage.getItem(_submitKey);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || alreadySubmitted) return;
    sessionStorage.setItem(_submitKey, '1');
    setPhase('saving');
    try {
      await DataService.createClient({
        name: name.trim(), phone: phone.trim(),
        address: address.trim() || undefined,
        referredBy: referrer.id, type: 'hogar',
        notes: `Registro por portal · referido por ${referrer.name}`,
      });
      setPhase('done');
    } catch (err) {
      sessionStorage.removeItem(_submitKey);
      setErrMsg(err.message);
      setPhase('error');
    }
  };

  const company = config?.companyName || 'NATIVA';
  const referrerFirst = referrer?.name?.split(' ')[0] || 'un amigo';
  const canSubmit = name.trim() && phone.trim() && address.trim() && phase !== 'saving' && !alreadySubmitted;

  return (
    <div style={{
      width: '100%', height: '100vh', maxWidth: 480, margin: '0 auto',
      background: G.bg, color: G.text, fontFamily: GFF,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { background: ${G.bg}; }
        @keyframes gSpin { to { transform: rotate(360deg); } }
        @keyframes gPop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        input:focus { border-color: ${G.text} !important; }
      `}</style>

      <svg viewBox="0 0 400 240" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 240, color: G.text, opacity: 0.05, pointerEvents: 'none' }}>
        <path d="M0 120 Q 100 80 200 120 T 400 120" fill="none" stroke="currentColor" strokeWidth="1"/>
        <path d="M0 160 Q 100 120 200 160 T 400 160" fill="none" stroke="currentColor" strokeWidth="1"/>
        <path d="M0 200 Q 100 160 200 200 T 400 200" fill="none" stroke="currentColor" strokeWidth="1"/>
      </svg>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

        {phase === 'loading' && (<>
          <NativaLogoLockup size={1.1} subline="VOLVÉ A LO NATURAL"/>
          <div style={{ marginTop: 48, width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${G.surfaceHi}`, borderTopColor: G.text, animation: 'gSpin 1s linear infinite' }}/>
        </>)}

        {(phase === 'form' || phase === 'saving') && (<>
          <NativaWordmarkCompact/>
          <div style={{ width: '100%', maxWidth: 340, marginTop: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15 }}>
                {referrerFirst} te invitó a NATIVA
              </div>
              <div style={{ fontSize: 14, color: G.muted, marginTop: 8, lineHeight: 1.5 }}>
                Dejá tus datos y te contactamos pronto con tu acceso.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre completo</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                  style={{ width: '100%', padding: '13px 14px', border: `0.5px solid ${G.hairline}`, borderRadius: 12, background: G.surface, color: G.text, fontFamily: GFF, fontSize: 15, outline: 'none', transition: 'border-color .15s' }}/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Teléfono</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 9 …"
                  style={{ width: '100%', padding: '13px 14px', border: `0.5px solid ${G.hairline}`, borderRadius: 12, background: G.surface, color: G.text, fontFamily: GFF, fontSize: 15, outline: 'none', transition: 'border-color .15s' }}/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Dirección</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle y número"
                  style={{ width: '100%', padding: '13px 14px', border: `0.5px solid ${G.hairline}`, borderRadius: 12, background: G.surface, color: G.text, fontFamily: GFF, fontSize: 15, outline: 'none', transition: 'border-color .15s' }}/>
              </div>
              <button onClick={handleSubmit} disabled={!canSubmit} style={{
                marginTop: 6, padding: '14px', width: '100%',
                background: canSubmit ? G.accent : G.surfaceHi,
                color: canSubmit ? '#fff' : G.dim,
                border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600, letterSpacing: -0.2, fontFamily: GFF,
                cursor: canSubmit ? 'pointer' : 'default',
              }}>
                {phase === 'saving' ? 'Enviando…' : 'Registrarme'}
              </button>
            </div>
          </div>
        </>)}

        {phase === 'done' && (<>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: G.successSoft, color: G.success, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, animation: 'gPop .4s cubic-bezier(.34,1.56,.64,1)' }}>
            <VI.check size={42} w={2.4}/>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, textAlign: 'center' }}>¡Listo!</div>
          <div style={{ fontSize: 14, color: G.muted, marginTop: 10, textAlign: 'center', lineHeight: 1.5, maxWidth: 280 }}>
            {company} ya tiene tus datos y te va a contactar pronto con tu acceso al portal.
          </div>
        </>)}

        {(phase === 'invalid' || phase === 'error') && (<>
          <NativaLogoLockup size={1} subline="VOLVÉ A LO NATURAL"/>
          <div style={{ marginTop: 40, width: '100%', maxWidth: 320, background: G.surface, border: `0.5px solid ${G.hairline}`, borderRadius: 18, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: G.dangerSoft, color: G.danger, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>
              {phase === 'error' ? 'Error al registrarse' : 'Link inválido'}
            </div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 8, lineHeight: 1.5 }}>
              {phase === 'error' ? errMsg : 'Este link de referido no es válido. Pedíle uno nuevo a tu amigo.'}
            </div>
          </div>
        </>)}

      </div>

      <div style={{ padding: '16px 32px 32px', textAlign: 'center', fontSize: 10, color: G.dim, letterSpacing: 1.5, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
        {company} · Gualeguay, Entre Ríos · 2026
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function ClientPortalApp({ client: initialClient, config }) {
  const [client, setClient] = React.useState(initialClient);
  const [tab, setTab] = React.useState('home');
  const [prevTab, setPrevTab] = React.useState('home');

  const handleTab = (t) => {
    if (t !== 'account') setPrevTab(t);
    setTab(t);
  };

  const openAccount = () => handleTab('account');

  return (
    <div style={{
      width: '100%', height: '100vh',
      background: G.bg, color: G.text, fontFamily: GFF,
      maxWidth: 480, margin: '0 auto',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { background: ${G.bg}; }
        ::-webkit-scrollbar { display: none; }
        input[type=range] { accent-color: ${G.accent}; }
        textarea, button { font-family: ${GFF}; }
        @keyframes gFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gPop  { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes gSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div key={tab} style={{ position: 'absolute', inset: 0, animation: 'gFade .22s ease' }}>
        {tab === 'home'      && <PortalHome      client={client} config={config} onTab={handleTab} onAvatarClick={openAccount}/>}
        {tab === 'order'     && <PortalOrder     client={client} config={config} onDone={() => handleTab('orders')} onTab={handleTab} onAvatarClick={openAccount}/>}
        {tab === 'orders'    && <PortalOrders    client={client} config={config} onTab={handleTab} onAvatarClick={openAccount}/>}
        {tab === 'store'     && <PortalStore     client={client} config={config} onTab={handleTab} onAvatarClick={openAccount}/>}
        {tab === 'invoices'  && <PortalInvoices  client={client} config={config} onTab={handleTab} onAvatarClick={openAccount}/>}
        {tab === 'referrals' && <PortalReferrals client={client} config={config} onTab={handleTab} onAvatarClick={openAccount}/>}
        {tab === 'account'   && <PortalAccount   client={client} config={config} onClose={() => handleTab(prevTab)} onTab={handleTab} onClientUpdate={setClient}/>}
      </div>
    </div>
  );
}

// ─── Root (token auth + splash) ───────────────────────────────────────────────

function ClientPortalPage() {
  const [state, setState] = React.useState('loading');
  const [client, setClient] = React.useState(null);
  const [config, setConfig] = React.useState(null);
  const [refCode, setRefCode] = React.useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const urlToken = params.get('token');
    const token = urlToken || localStorage.getItem('nativa_client_token');
    if (!token) {
      if (ref) { setRefCode(ref); setState('referral-signup'); return; }
      setState('no-token'); return;
    }
    localStorage.setItem('nativa_client_token', token);
    if (urlToken) window.history.replaceState({}, '', window.location.pathname);
    Promise.all([DataService.getClientByToken(token), DataService.getConfig()])
      .then(([cl, cfg]) => {
        if (!cl) { setState('invalid'); return; }
        setClient(cl); setConfig(cfg); setState('ready');
      })
      .catch(() => setState('invalid'));
  }, []);

  if (state === 'ready') return <ClientPortalApp client={client} config={config}/>;
  if (state === 'referral-signup') return <ReferralSignup refCode={refCode}/>;

  // Splash screens
  return (
    <div style={{
      width: '100%', height: '100vh', maxWidth: 480, margin: '0 auto',
      background: G.bg, color: G.text, fontFamily: GFF,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { background: ${G.bg}; }
        @keyframes gSpin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Decorative waves */}
      <svg viewBox="0 0 400 240" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 240, color: G.text, opacity: 0.05, pointerEvents: 'none' }}>
        <path d="M0 120 Q 100 80 200 120 T 400 120" fill="none" stroke="currentColor" strokeWidth="1"/>
        <path d="M0 160 Q 100 120 200 160 T 400 160" fill="none" stroke="currentColor" strokeWidth="1"/>
        <path d="M0 200 Q 100 160 200 200 T 400 200" fill="none" stroke="currentColor" strokeWidth="1"/>
      </svg>

      {state !== 'loading' && (
        <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: G.muted, textTransform: 'uppercase' }}>Portal del cliente</div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px', position: 'relative', zIndex: 1 }}>
        {state === 'loading' ? (<>
          <NativaLogoLockup size={1.15} subline="VOLVÉ A LO NATURAL"/>
          <div style={{
            marginTop: 48, width: 24, height: 24, borderRadius: '50%',
            border: `1.5px solid ${G.surfaceHi}`, borderTopColor: G.text,
            animation: 'gSpin 1s linear infinite',
          }}/>
        </>) : (<>
          <NativaLogoLockup size={1} subline="VOLVÉ A LO NATURAL"/>
          <div style={{
            marginTop: 48, width: '100%', maxWidth: 320,
            background: G.surface, border: `0.5px solid ${G.hairline}`,
            borderRadius: 18, padding: 24, textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: state === 'invalid' ? G.dangerSoft : G.accentSoft,
              color: state === 'invalid' ? G.danger : G.text,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              {state === 'invalid' ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              )}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>
              {state === 'invalid' ? 'Link inválido o expirado' : 'Necesitás tu link de acceso'}
            </div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 8, lineHeight: 1.5 }}>
              {state === 'invalid'
                ? 'Pedíle a NATIVA que te envíe un link nuevo por WhatsApp.'
                : 'Pedíle a NATIVA tu link personal por WhatsApp. Es seguro, único y no caduca.'}
            </div>
            <button onClick={() => window.open('https://wa.me/', '_blank')} style={{
              marginTop: 18, width: '100%', padding: '13px',
              background: G.whatsapp, color: '#fff', border: 'none',
              borderRadius: 12, fontSize: 14, fontWeight: 600, letterSpacing: -0.1,
              fontFamily: GFF, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2z"/></svg>
              Pedir mi link
            </button>
          </div>
        </>)}
      </div>

      <div style={{ padding: '16px 32px 32px', textAlign: 'center', fontSize: 10, color: G.dim, letterSpacing: 1.5, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>NATIVA · Gualeguay, Entre Ríos · 2026</div>
    </div>
  );
}

// ─── Mount ────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(ClientPortalPage)
);
