# NATIVA — Bitácora del sistema

Sistema de gestión completo para distribución de agua (bidones). Tres aplicaciones sobre un backend Supabase compartido.

---

## Arquitectura general

```
viago/
├── ViaGo/              → App web admin (fuente)
├── docs/               → Copia exacta de ViaGo/ → publicada en GitHub Pages (guanativa.com.ar)
├── repartidor-app/     → App móvil Android (Expo + React Native)
├── supabase/           → Edge Functions + migrations
└── agents/             → Agentes Python (Railway)
```

**Regla crítica:** todo cambio en `ViaGo/` debe copiarse a `docs/` antes de commitear. Son archivos idénticos — `docs/` es el deploy de GitHub Pages.

**Rama de desarrollo:** `claude/distribution-app-design-mlaJo`

---

## 1. App web — Panel de administración

**URL:** guanativa.com.ar (GitHub Pages desde `docs/`)

**Stack:** React 18 + Babel Standalone (sin build step) + Supabase JS v2 + Tailwind CSS CDN + Leaflet v1.9.4

**Punto de entrada:** `ViaGo/index.html`
- Carga todos los scripts via `<script type="text/babel" src="...?v=3">`
- El número `v=3` es el cache-buster — incrementar en cada deploy
- Los scripts son globales (no módulos ES), orden de carga importa

**Orden de carga de scripts:**
1. `utils/supabaseClient.js` — inicializa `SupabaseDB`
2. `utils/dataService.js` — `DataService` (objeto global con todos los métodos)
3. `utils/icons.js` — `Icon` component (Lucide)
4. `utils/whatsappService.js`, `pdfService.js`, `geoService.js`, `metaService.js`
5. `components/Sidebar.js`, `Auth.js`
6. Todos los módulos (Dashboard, Clients, Orders, etc.)
7. Script inline con `App()` root + `ReactDOM.createRoot`

**Auth admin:** Supabase Auth (email + password). Signup solo vía `index.html?setup=1`. Login normal en `index.html`.

### Módulos (components/)

| Archivo | Módulo | Descripción |
|---|---|---|
| Auth.js | — | Login/signup admin. Signup protegido con `?setup=1` |
| Dashboard.js | Dashboard | Stats del día, gráfico semanal, clientes inactivos |
| Sidebar.js | — | Navegación lateral |
| Clients.js | Clientes | CRUD clientes, saldo, historial, referidos |
| Orders.js | Pedidos | Crear/editar pedidos, asignar productos |
| Delivery.js | Reparto | Vista de entregas del día, cambio de estado |
| Billing.js | Facturación | Facturas, cobros, métodos de pago |
| Products.js | Productos | Catálogo y precios |
| Zones.js | Zonas | Zonas de entrega |
| Loyalty.js | Fidelización | Puntos, canjes, rachas, referidos |
| Prospecting.js | Captación | Leads, competidores, Google Places |
| Costs.js | Costos | Gastos mensuales, ingresos |
| Config.js | Configuración | Datos empresa, PIN repartidor, ajustes |
| Dispensers.js | Dispensadores | Máquinas dispensadoras |
| Machines.js / Purificadora.js | Máquinas | Purificadoras, mantenimiento, litros |
| LiveTracking.js | Seguimiento | Mapa en tiempo real del repartidor |
| MapView.js | — | Componente mapa (Leaflet) |
| MetaAds.js | Meta Ads | Integración Facebook/Instagram Ads |
| Backup.js | Backup | Exportar datos |

---

## 2. Portal cliente

**URL:** `guanativa.com.ar/client.html?token=XXX`

**Archivo:** `ViaGo/client.html` + `ViaGo/components/ClientPortal.js`

**Auth:** token único por cliente (campo `access_token` en tabla `clients`). Se guarda en `localStorage` y se limpia de la URL con `history.replaceState`.

**Funcionalidades:**
- Ver saldo, historial de pedidos, facturas
- Editar nombre, teléfono y dirección propios (usa `DataService.updateClientSelf` — solo esos 3 campos)
- Referir nuevos clientes (formulario con nombre, teléfono, dirección)
- Anti-spam en referidos: `sessionStorage` keyed por `refCode`

**Header RLS:** el token se pasa como `x-client-token` en el header de Supabase para que las RLS policies filtren datos por cliente.

---

## 3. App repartidor web (legacy)

**URL:** `guanativa.com.ar/repartidor.html`

Auth por PIN (4 dígitos). Lockout tras 5 intentos fallidos (60s). PIN configurado en admin → Configuración.

---

## 4. App repartidor móvil (Expo)

**Directorio:** `repartidor-app/`

**Stack:** Expo ~51 + React Native 0.74 + React Navigation (native stack) + Supabase JS v2 + expo-location

**Build:** EAS Build → APK directo (Android only, sin Play Store)
```bash
cd repartidor-app
eas build -p android --profile preview
```
Perfil `preview` genera `.apk` instalable. Perfil `production` genera `.aab` para Play Store.

### Pantallas

| Pantalla | Archivo | Descripción |
|---|---|---|
| Pin | `src/screens/PinScreen.js` | PIN 4 dígitos, lockout 5 intentos / 60s, vibración en error |
| Home | `src/screens/HomeScreen.js` | Lista pedidos del día, stats (pendientes/entregados/total), GPS en background |
| Order | `src/screens/OrderScreen.js` | Detalle pedido, cambio de estado, WhatsApp, Google Maps, cobro |

### Componentes

| Componente | Archivo | Descripción |
|---|---|---|
| CobroModal | `src/components/CobroModal.js` | Bottom sheet: seleccionar método de pago (efectivo/transferencia/mercadopago), crea factura + actualiza estado a "entregado" |

### GPS
`HomeScreen` usa `Location.watchPositionAsync` (30s / 100m). Guarda en tabla `driver_locations` via `DataService.upsertDriverLocation`. El admin ve la ubicación en LiveTracking.

### Supabase en React Native
`AsyncStorage` como storage. `persistSession: false` (no usa Supabase Auth — acceso directo con anon key).

---

## 5. Backend — Supabase

**Proyecto:** `ezxfgawujagatrqylyvo` (nativa-agua)

**URL:** `https://ezxfgawujagatrqylyvo.supabase.co`

**Atención:** tier gratuito — se pausa tras 1 semana de inactividad. Reactivar desde el Dashboard → "Resume project".

### Tablas

| Tabla | Descripción clave |
|---|---|
| `config` | Fila única (id=1): nombre empresa, PIN repartidor, ajustes globales |
| `clients` | `access_token`, `referral_code`, `balance`, `points`, `active`, `order_streak`, `pay_streak` |
| `products` | `active`, precio |
| `zones` | Zonas de entrega |
| `orders` | `delivery_date`, `status` (pendiente/en camino/entregado/cancelado), `client_id`, `total` |
| `invoices` | `payment_method`, `payment_status`, `total`, `client_id`, `order_id` |
| `leads` | Prospectos CRM |
| `competitors` | Competidores (strength: dominante/intermedio/debil) |
| `balance_movements` | Historial de crédito/débito de saldo |
| `points_history` | Historial de puntos de fidelización |
| `promotions` | Promociones activas |
| `costs` | Gastos (date, category, amount) |
| `dispensers` | Dispensadores de agua |
| `machines` | Purificadoras (liters_total, last_maintenance) |
| `maintenance_logs` | Logs de mantenimiento de máquinas |
| `driver_locations` | Posición GPS del repartidor (última conocida) |

### Funciones SQL
- `get_dashboard_stats()` — retorna JSON con `todayOrdersCount`, `todayDeliveredCount`, `todayPendingCount`, `todayRevenue`, `monthRevenue`, `totalClients`, `newClientsThisMonth`, `pendingPayments`, `repurchaseRate`, `weekData[]`
- `next_client_code()` — genera código correlativo para nuevos clientes

### RLS
Políticas configuradas: usuarios `authenticated` tienen acceso total (FOR ALL). Anon key solo para portal cliente (filtrado por `x-client-token`).

### Edge Functions
- `meta-api-proxy` — proxy para Meta Ads API (evita CORS)
- `meta-webhook` — recibe eventos de Meta

---

## 6. DataService (`ViaGo/utils/dataService.js`)

Objeto global `DataService`. Métodos organizados por dominio:

- **Conversión snake_case↔camelCase:** `_js(row)` / `_db(obj)` / `_jsMany(arr)`
- **Auth:** `signIn`, `signUp`, `signOut`, `getSession`
- **Config:** `getConfig`, `saveConfig`
- **Clients:** `getClients(includeInactive)`, `getClient`, `getClientByToken`, `createClient`, `updateClient`, `updateClientSelf` *(solo name/phone/address — para portal cliente)*, `deleteClient`, `getInactiveClients(days)`
- **Orders:** `getOrders`, `getTodayOrders`, `getOrdersByDate(date)`, `createOrder`, `updateOrder`
- **Invoices:** `getInvoices`, `getInvoicesByDate(date)`, `createInvoice`, `updateInvoice`
- **Leads:** `getLeads`, `createLead`, `updateLead`, `deleteLead`
- **Competitors:** `getCompetitors`, `createCompetitor`, `updateCompetitor`, `deleteCompetitor`
- **Analytics:** `getDashboardStats()` — llama a RPC `get_dashboard_stats`
- **Costs:** `getCosts(month)`, `createCost`, `updateCost`, `deleteCost`
- **Driver:** `getDriverLocation`, `upsertDriverLocation(lat, lng, name)`
- **Helpers:** `formatCurrency(n)`, `formatDate(d)`, `today()`

---

## 7. Seguridad implementada

- **Admin login:** lockout tras 5 intentos fallidos (60s), estado en módulo-level (`_loginState`)
- **Signup admin:** solo accesible via `?setup=1` en la URL, no visible en login normal
- **Portal cliente:** token en localStorage, limpiado de URL con `history.replaceState`
- **updateClientSelf:** whitelist de campos (solo name/phone/address, con límites de longitud)
- **PIN repartidor:** lockout tras 5 intentos (60s), vibración en error
- **Referidos:** anti-spam con `sessionStorage` por `refCode`
- **RLS Supabase:** políticas para autenticados. Anon key restringida por `x-client-token`

---

## 8. Módulo Purificadora (ESP32)

**Componente:** `ViaGo/components/Purificadora.js`

**Concepto:** El ESP32 físico (máquina de ósmosis inversa) se comunica con Supabase como bridge en la nube. El admin controla la máquina en tiempo real desde el navegador.

### Tablas Supabase usadas
| Tabla | Dirección | Descripción |
|---|---|---|
| `purif_status` | ESP32 → Supabase | El ESP32 hace POST cada ~2s con su estado (JSON en campo `payload`) |
| `purif_commands` | Admin → Supabase → ESP32 | El admin escribe comandos; el ESP32 los lee y ejecuta |

### Flujo de comunicación
```
Admin (browser) ←── polling cada 2s ──→ purif_status (Supabase)
Admin (browser) ──── POST comando ────→ purif_commands (Supabase)
ESP32 ──── POST payload c/ estado ────→ purif_status (Supabase)
ESP32 ──── GET polling comandos ──────→ purif_commands (Supabase)
```

### Datos que publica el ESP32 (`purif_status.payload`)
- Estado del motor (on/off), alarmas activas
- Horas de uso de membrana y lámpara UV (alertas en 8760h y 9000h)
- Programación horaria (`schedule`: enabled, onH, onM, offH, offM)
- Historial almacenado localmente en el ESP32

### Comandos que envía el admin (`purif_commands`)
- Encender/apagar motor
- Configurar programación horaria (hora ON / hora OFF)
- Reset de contadores

### Conexión badge
- `connected` — último update hace < 8s
- `slow` — hace 8-20s
- `disconnected` — hace > 20s o sin datos

### Nota
El ESP32 usa NTP para sincronizar hora (UTC-3, Argentina). El historial se guarda localmente en el ESP32, no en Supabase.

---

## 9. Flujo de deploy

```bash
# 1. Editar en ViaGo/
# 2. Copiar a docs/
cp ViaGo/components/Foo.js docs/components/Foo.js
cp ViaGo/utils/dataService.js docs/utils/dataService.js

# 3. Commit y push a la rama de desarrollo
git add ViaGo/... docs/...
git commit -m "feat/fix: descripción"
git push -u origin claude/distribution-app-design-mlaJo
```

GitHub Pages publica automáticamente desde `docs/` en la rama correspondiente.

---

## 10. Pendientes / próximos features

- [ ] **Firma digital** en app repartidor: cliente firma en pantalla al recibir el pedido. Guardar como base64 en tabla `invoices`. Librería: `react-native-signature-canvas`.
- [ ] **PWA** para portal cliente (manifest.json + service worker) — para que clientes puedan "instalar" desde el navegador en iOS/Android.
- [ ] **RLS Supabase** — revisar y refinar políticas por tabla (actualmente todas las tablas tienen acceso total para `authenticated`).
- [ ] **Subir a Play Store** — cuando corresponda, buildear con perfil `production` (genera `.aab`).
- [ ] **Upgrade Supabase Pro** ($25/mes) — para evitar pausas automáticas en producción.
