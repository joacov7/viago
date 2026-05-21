# NATIVA — Auditoría de Performance y Escalabilidad

---

## El problema más grave: PostgREST silently trunca a 1000 filas

**Gravedad:** CRÍTICA  
**Archivos:** `ViaGo/utils/dataService.js` (múltiples funciones)

Supabase PostgREST tiene un límite por defecto de 1000 filas por query. **Ninguna query en DataService especifica `.limit()` ni `.range()`.** Cuando la tabla supere 1000 registros, las queries devolverán silenciosamente 1000 resultados sin ningún error ni warning. El admin verá datos incompletos sin saber que está incompleto.

Con el volumen típico de una distribuidora activa:
- 500 clientes → afectado desde ~mes 18
- 10.000 pedidos anuales → afectado desde el primer año
- 50.000 pedidos históricos → dashboard completamente inútil

**Afecta a:**
- `getOrders()` → dashboard, delivery, billing incompletos
- `getClients()` → listados, analytics incompletos
- `getInvoices()` → balance financiero incorrecto
- `getDashboardStats()` → métricas del negocio erróneas (silenciosamente)
- `getInactiveClients()` → reactivación de clientes basada en datos falsos
- `getLeads()` → leads perdidos silenciosamente

---

## PERF-001 — getDashboardStats: carga todo en memoria del browser

**Gravedad:** ALTA  
**Archivos:** `ViaGo/utils/dataService.js:458-488`

```javascript
async getDashboardStats() {
  const [orders, clients, invoices] = await Promise.all([
    this.getOrders(),    // TODOS los pedidos
    this.getClients(),   // TODOS los clientes
    this.getInvoices(),  // TODAS las facturas
  ]);
  // Filtra client-side
  const todayOrders = orders.filter(o => o.deliveryDate === today);
  const monthOrders = orders.filter(o => ...);
```

Descarga y filtra en el browser. Con 12 meses de operación real:
- ~5000 pedidos × ~500 bytes JSON = 2.5 MB solo de pedidos
- ~2000 facturas × ~400 bytes = 0.8 MB
- 3 requests paralelos, serialización JSON, hydration en React

**Tiempo estimado con datos reales:** 3-8 segundos en conexión móvil.

### Solución

Reemplazar con queries SQL agregadas:

```javascript
async getDashboardStats() {
  const today = this.today();
  const monthStart = today.slice(0, 7) + '-01';
  
  const [todayStats, monthStats, clientCount] = await Promise.all([
    this._sb.from('orders')
      .select('status, total', { count: 'exact' })
      .eq('delivery_date', today),
    this._sb.from('invoices')
      .select('total, payment_status')
      .gte('created_at', monthStart),
    this._sb.from('clients').select('*', { count: 'exact', head: true }).eq('active', true),
  ]);
}
```

---

## PERF-002 — getInactiveClients: query sin filtro de fecha

**Gravedad:** ALTA  
**Archivos:** `ViaGo/utils/dataService.js:213-223`

```javascript
async getInactiveClients(days = 21) {
  const [clients, { data: orders }] = await Promise.all([
    this.getClients(),
    this._sb.from('orders').select('client_id, created_at').order('created_at', { ascending: false }),
    // ↑ SIN FILTRO: descarga TODOS los pedidos históricos
  ]);
```

Esta función descarga absolutamente todos los pedidos de la historia del sistema para encontrar el último pedido de cada cliente. Con 3 años de operación, esto puede ser 30.000+ filas.

### Solución

```javascript
const cutoffDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
// Solo pedidos recientes + usar created_at con gte
const { data: recentOrders } = await this._sb
  .from('orders')
  .select('client_id')
  .gte('delivery_date', cutoffDate);
const activeClientIds = new Set(recentOrders.map(o => o.client_id));
```

---

## PERF-003 — Backup.js exporta todo sin límite en el browser

**Gravedad:** MEDIA  
**Archivos:** `ViaGo/components/Backup.js:49-76`

```javascript
const [clients, orders, zones, products, invoices, leads, cfg] = await Promise.all([
  DataService.getClients(true),  // Todos los clientes (inc. inactivos)
  DataService.getOrders(),       // TODOS los pedidos históricos
  ...
]);
```

El export JSON de un sistema con 3 años de datos puede superar los 50MB. Los browsers tienen límites de memoria de ~512MB por tab. La serialización JSON de un array gigante puede freezear el tab.

### Solución

- Paginación por lotes de 500 registros con scroll
- O exportación server-side via Edge Function (stream HTTP)
- Para CSV: streaming con WritableStream API

---

## PERF-004 — Babel Standalone en producción

**Gravedad:** MEDIA  
**Archivos:** `ViaGo/index.html:13`, `ViaGo/client.html:12`

```html
<script src="https://resource.trickle.so/vendor_lib/unpkg/@babel/standalone/babel.min.js"></script>
```

`@babel/standalone` pesa ~1.5MB minificado. Se carga en cada visita y transpila JSX en el browser en runtime. Esto:
- Añade 500ms-2s de parse + transpile time en el primer load
- No permite code splitting
- No permite tree shaking
- No aprovecha HTTP/2 multiplexing eficientemente (un script monolítico)

**Impacto en móviles (target real de la app):** En una conexión 3G argentina, solo descargar Babel tarda ~3 segundos.

### Solución a largo plazo

Build step con Vite o Next.js. La app puede quedar idéntica en funcionalidad pero con bundle optimizado. No es urgente pero es el mayor lastre de performance estructural.

---

## PERF-005 — N queries en lugar de JOINs

**Gravedad:** MEDIA  
**Archivos:** `agents/tools.py:65-78`, `docs/repartidor-app.js:163-171`

**En tools.py PendingInvoicesTool:**
```python
rows = db.table("invoices").select(...).execute().data
client_ids = list({r["client_id"] for r in rows})
clients = {c["id"]: c for c in db.table("clients").select(...).in_("id", client_ids).execute().data}
```

Son 2 queries separadas donde debería ser 1 query con JOIN. PostgREST soporta:
```
/invoices?select=*,clients(name,phone)&payment_status=eq.pendiente
```

**En repartidor-app.js:**
```javascript
const [orders, clients, zones] = await Promise.all([
  DataService.getTodayOrders(),
  DataService.getClients(true),  // Todos los clientes activos
  DataService.getZones(),
]);
```

El repartidor descarga TODOS los clientes activos (potencialmente 500+) solo para hacer un `.find()` client-side. Debería ser un JOIN en PostgREST.

---

## PERF-006 — getDashboardStats usa filter client-side para gráfico semanal

**Gravedad:** BAJA**  
**Archivos:** `ViaGo/utils/dataService.js:469-474`

```javascript
const weekData = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i));
  const dateStr = d.toISOString().split('T')[0];
  const dayRevenue = invoices.filter(inv => (inv.createdAt || '').startsWith(dateStr) && ...)
    .reduce(...);
  return { ..., orders: orders.filter(o => o.deliveryDate === dateStr && ...).length };
});
```

7 iteraciones filtrando sobre arrays potencialmente de miles de elementos. O(7×N) donde N crece ilimitado. Con 10.000 invoices, son 70.000 comparaciones de string en el browser.

---

## PERF-007 — Service Worker: cache ineficaz por mismatch de nombres

**Gravedad:** MEDIA  
**Archivos:** `docs/sw-client.js`

```javascript
const STATIC = [
  './components/ClientPortal.js',  // Cache sin query string
];
```

Pero el HTML carga:
```html
<script src="components/ClientPortal.js?v=4">
```

Estas son dos URLs diferentes para el Service Worker. El archivo cacheado (`ClientPortal.js`) nunca se sirve porque las requests entrantes incluyen `?v=4`. El cache del SW es inútil para los scripts versionados.

**Resultado:** El portal del cliente no funciona offline cuando debería (es una PWA).

### Solución

```javascript
const STATIC = [
  './client.html',
  './utils/supabaseClient.js?v=4',
  './utils/dataService.js?v=4',
  './components/ClientPortal.js?v=4',
];
// Y cuando hay nueva versión, cambiar CACHE = 'nativa-client-v2'
```

---

## PERF-008 — GPS watchPosition sin throttling

**Gravedad:** BAJA  
**Archivos:** `docs/repartidor-app.js:147-149`

```javascript
watchIdRef.current = navigator.geolocation.watchPosition(send, onError, {
  enableHighAccuracy: true, maximumAge: 15000, timeout: 20000,
});
```

`enableHighAccuracy: true` activa el GPS del hardware (vs WiFi/cell triangulation). Consume batería significativamente. `maximumAge: 15000` permite usar una posición de hace 15 segundos, pero en la práctica el GPS se actualiza cada ~1-3 segundos con `enableHighAccuracy`. Cada update hace un upsert a Supabase.

Con 8 horas de reparto: ~10.000 requests de upsert de ubicación.

### Solución

Throttle de mínimo 30 segundos entre upserts:

```javascript
let lastUpsert = 0;
const send = pos => {
  const now = Date.now();
  if (now - lastUpsert < 30000) return;
  lastUpsert = now;
  DataService.upsertDriverLocation(lat, lng, name);
};
```

---

## PERF-009 — CrewAI ThreadPoolExecutor con max_workers=2

**Gravedad:** MEDIA  
**Archivos:** `agents/main.py:18`

```python
executor = ThreadPoolExecutor(max_workers=2)
```

El bot y el scheduler comparten el mismo proceso Python. El scheduler también usa requests síncronos (a Supabase, Meta API, Telegram). Si dos requests del dueño llegan simultáneamente:
- Worker 1: crew.kickoff() → puede tardar 10-30 segundos (LLM round trips)
- Worker 2: crew.kickoff() → ídem
- Request 3: se encola en el ThreadPoolExecutor → espera indefinidamente

El bot parece congelado para el dueño. No hay timeout configurado.

### Solución

```python
# Timeout en el executor
result = await asyncio.wait_for(
  loop.run_in_executor(executor, _run_crew, text),
  timeout=60.0
)
```

---

## PERF-010 — Geocodificación secuencial en optimización de ruta

**Gravedad:** BAJA  
**Archivos:** `docs/repartidor-app.js:203-212`

```javascript
for (let i = 0; i < pending.length; i++) {
  const coords = await GeoService.geocode(addr);  // Secuencial
}
```

Si hay 15 entregas pendientes: 15 requests geocode secuenciales. Cada uno puede tardar 500ms-2s. Total: 7-30 segundos esperando.

### Solución

```javascript
const coordsResults = await Promise.all(
  pending.map(o => o.client?.address
    ? GeoService.geocode(o.client.address).then(coords => [o.id, coords])
    : Promise.resolve([o.id, null])
  )
);
const coordsMap = Object.fromEntries(coordsResults.filter(([, c]) => c));
```

---

## Proyección de Límites de Escala

| Métrica | Límite actual (estimado) | Impacto al superar |
|---------|--------------------------|-------------------|
| Pedidos en BD | ~1000 | getDashboardStats incorrecto sin warning |
| Clientes activos | ~1000 | getClients incompleto sin warning |
| Facturas | ~1000 | balances financieros incorrectos |
| Repartidores simultáneos | 1 | imposible escalar reparto |
| Requests del dueño al bot | 2 simultáneos | bot bloqueado |
| Entregas/día en repartidor | Sin límite técnico | performance degradada con 50+ |
| Campañas × clientes | Sin límite | Telegram chunking manual puede fallar |
