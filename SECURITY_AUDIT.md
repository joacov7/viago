# NATIVA — Auditoría de Seguridad

> Nivel: pentest de caja blanca completo (acceso al código fuente, esquema de BD y configuración).
> Todas las vulnerabilidades listadas son explotables con recursos mínimos.

---

## VULN-001 — CLIENT SELF-UPDATE: Escalación de privilegios en portal del cliente

**Gravedad:** CRÍTICA  
**Archivos:** `supabase-rls.sql:150-153`, `supabase-rls-fix.sql:58-61`

### Descripción técnica

La política RLS `client_self_update` permite a un cliente autenticado con token actualizar CUALQUIER columna de su fila en la tabla `clients`:

```sql
CREATE POLICY "client_self_update" ON clients
  FOR UPDATE TO anon
  USING (access_token = get_client_token() AND active = true AND get_client_token() != '')
  WITH CHECK (access_token = get_client_token() AND active = true);
```

PostgreSQL RLS no restringe columnas, solo filas. La condición `WITH CHECK` solo verifica que el token siga siendo el correcto y que `active = true`. Un cliente puede actualizar `points`, `balance`, `referred_by`, `zone_id`, `type`, y cualquier otro campo.

### Reproducción

```bash
# Con la anon key del repositorio y el token del cliente (recibido por WhatsApp):
curl -X PATCH \
  'https://ezxfgawujagatrqylyvo.supabase.co/rest/v1/clients?id=eq.42' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'x-client-token: <token_del_cliente>' \
  -H 'Content-Type: application/json' \
  -d '{"points": 999999, "balance": 50000}'
```

### Impacto real en producción

- Cualquier cliente puede darse infinitos puntos y canjearlos en la tienda
- Cualquier cliente puede acreditar saldo en su cuenta corriente
- Cualquier cliente puede cambiar su `type` (hogar → empresa, con diferentes precios)
- Un cliente puede cambiar `referred_by` para robar bonos de referido

### Causa raíz

PostgreSQL no permite RLS por columnas. Se necesita una Edge Function como intermediario.

### Solución recomendada

Reemplazar el UPDATE directo desde el portal por una Edge Function que solo permita actualizar campos específicos:

```sql
-- Revocar la política actual
DROP POLICY "client_self_update" ON clients;
-- Solo el admin puede actualizar directamente
```

```typescript
// Edge Function: /functions/client-update/index.ts
// Solo acepta: email, phone, address, city
// Usa service_role internamente
```

**Prioridad de corrección:** INMEDIATA

---

## VULN-002 — CLIENT POINTS INSERT: Inserción libre de puntos

**Gravedad:** ALTA  
**Archivos:** `supabase-rls.sql:130-138`, `supabase-rls-fix.sql:77-80`

### Descripción técnica

```sql
CREATE POLICY "client_points_insert" ON points_history
  FOR INSERT TO anon
  WITH CHECK (client_id = (
    SELECT id FROM clients
    WHERE access_token = get_client_token() ...
  ));
```

Cualquier cliente puede insertar registros en `points_history` con cualquier valor de `points`, incluyendo valores positivos grandes. Esto no actualiza `clients.points` directamente (eso requiere la policy de update), pero:
1. Contamina el historial auditable
2. Puede usarse para entender el sistema y preparar VULN-001

### Reproducción

```bash
curl -X POST \
  'https://ezxfgawujagatrqylyvo.supabase.co/rest/v1/points_history' \
  -H 'Authorization: Bearer <anon>' \
  -H 'x-client-token: <token>' \
  -H 'Content-Type: application/json' \
  -d '{"client_id": 42, "points": 9999, "action": "earned", "description": "promo especial"}'
```

### Solución recomendada

Eliminar `client_points_insert`. Toda operación de puntos debe ejecutarse en Edge Functions con service_role. El canje en tienda debe ir por `/functions/store-redeem`, no por INSERT directo.

**Prioridad de corrección:** ALTA

---

## VULN-003 — CLIENT ORDERS INSERT: Sin restricción de status

**Gravedad:** ALTA  
**Archivos:** `supabase-rls.sql:114-120`, `supabase-rls-fix.sql:68-71`

### Descripción técnica

```sql
CREATE POLICY "client_orders_insert" ON orders
  FOR INSERT TO anon
  WITH CHECK (client_id = (...));
```

No hay restricción sobre el campo `status`. Un cliente puede crear un pedido con `status: 'entregado'`. Aunque esto no dispara los side effects de `updateOrder` (que requieren una transición de estado), cuando el admin vea el pedido y lo edite, podría triggear la lógica de puntos.

Más peligroso: si el cliente crea un pedido con total inflado y status correcto, aparece en el dashboard del admin como deuda.

### Solución

```sql
CREATE POLICY "client_orders_insert" ON orders
  FOR INSERT TO anon
  WITH CHECK (
    client_id = (...) AND
    status = 'pendiente' AND
    total >= 0
  );
```

**Prioridad de corrección:** ALTA

---

## VULN-004 — DRIVER PIN y ADMIN_PASSWORD expuestos públicamente

**Gravedad:** CRÍTICA  
**Archivos:** `supabase-schema.sql:23`, `supabase-rls.sql:87`

### Descripción técnica

```sql
-- Schema: admin_password en config
admin_password text default ''

-- RLS: cualquier anon puede leer TODO config
CREATE POLICY "public_config" ON config FOR SELECT TO anon USING (true);
```

La política `public_config` no restringe columnas. La app del repartidor lee `config.driverPin` de la misma tabla config. Por lo tanto:

- `driver_pin`: legible sin autenticación
- `admin_password`: legible sin autenticación  
- `mp_public_key`: legible sin autenticación
- `whatsapp_number`: legible sin autenticación

### Reproducción

```bash
curl 'https://ezxfgawujagatrqylyvo.supabase.co/rest/v1/config?id=eq.1&select=driver_pin,admin_password,mp_public_key' \
  -H 'Authorization: Bearer <anon_key>' \
  -H 'apikey: <anon_key>'
```

### Impacto

- Acceso físico a la app del repartidor → ver todas las entregas, marcarlas como entregadas
- Si admin_password se usa como verificación en algún flow, queda comprometido

### Solución

```sql
-- Eliminar admin_password del schema (campo inútil y peligroso)
ALTER TABLE config DROP COLUMN IF EXISTS admin_password;

-- Mover driver_pin a tabla separada con RLS auth-only
CREATE TABLE driver_config (
  id integer primary key default 1,
  pin text not null default '0000'
);
ALTER TABLE driver_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_driver_config" ON driver_config FOR ALL TO authenticated USING (true);
-- Sin política anon
```

**Prioridad de corrección:** INMEDIATA

---

## VULN-005 — Race condition no-atómica en puntos y saldo

**Gravedad:** CRÍTICA (integridad de datos)  
**Archivos:** `ViaGo/utils/dataService.js:418-426`, `ViaGo/utils/dataService.js:225-231`

### Descripción técnica

`addPoints()`:
```javascript
// 1. SELECT
const { data: client } = await this._sb.from('clients').select('points').eq('id', clientId).single();
// 2. Compute
const newPoints = (client.points || 0) + points;
// 3. UPDATE (no atómico)
await this._sb.from('clients').update({ points: newPoints }).eq('id', clientId);
```

`adjustClientBalance()`:
```javascript
const client = await this.getClient(clientId);
const newBalance = parseFloat(((client.balance || 0) + amount).toFixed(2));
await this._sb.from('clients').update({ balance: newBalance }).eq('id', clientId);
await this._sb.from('balance_movements').insert({ client_id: clientId, amount, description });
```

Ambas son operaciones READ-MODIFY-WRITE sin transacción ni locking optimista. Escenario real:
- Entrega finalizada → `addPoints(cliente, 10, 'earned', '...')` + `addPoints(cliente, 50, 'streak', '...')`
- Ambas leen `points = 100` simultáneamente
- Una escribe `110`, la otra escribe `150`
- El valor real debería ser `160`. Se pierde una actualización.

Adicionalmente: `adjustClientBalance` inserta en `balance_movements` después del UPDATE. Si el INSERT falla (red, constraint), el saldo se modificó pero no hay registro. Inconsistencia garantizada.

### Reproducción

Difícil de reproducir intencionalmente, pero ocurre en producción cuando:
- El repartidor confirma la entrega con canje de puntos (varios `addPoints` en cascada)
- Dos entregas simultáneas del mismo cliente
- Factura pagada al mismo tiempo que una entrega

### Solución

Stored procedure en PostgreSQL para operaciones de puntos:

```sql
CREATE OR REPLACE FUNCTION increment_points(p_client_id bigint, p_points integer, p_action text, p_description text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE clients SET points = points + p_points WHERE id = p_client_id;
  INSERT INTO points_history (client_id, points, action, description)
  VALUES (p_client_id, p_points, p_action, p_description);
END;
$$;
```

Llamar vía `DataService._sb.rpc('increment_points', {...})`.

**Prioridad de corrección:** INMEDIATA

---

## VULN-006 — Race condition en generación de números de factura y códigos de cliente

**Gravedad:** ALTA  
**Archivos:** `ViaGo/utils/dataService.js:362-365`, `ViaGo/utils/dataService.js:141-144`

### Descripción técnica

```javascript
async _genInvoiceNumber() {
  const { data } = await this._sb.from('invoices')
    .select('number').order('id', { ascending: false }).limit(1);
  const maxNum = data && data[0] ? parseInt((data[0].number || '').replace('FAC-', '') || '0') : 0;
  return `FAC-${String(maxNum + 1).padStart(4, '0')}`;
}
```

Dos entregas simultáneas leen el mismo `maxNum`, generan el mismo `FAC-XXXX`, y una de las inserciones falla con violación de constraint UNIQUE. La entrega queda sin factura, sin puntos, sin streak. El repartidor ve "guardado" pero los datos están incompletos.

`_genClientCode` tiene el mismo problema.

### Impacto

- Facturas duplicadas o inexistentes
- Códigos de cliente duplicados (constraint UNIQUE lo previene, pero la operación falla silenciosamente)
- Estados inconsistentes: pedido marcado entregado, factura no creada

### Solución

Reemplazar con sequences de PostgreSQL:

```sql
CREATE SEQUENCE invoice_seq START 1;
-- En la función de creación:
number = 'FAC-' || LPAD(nextval('invoice_seq')::text, 4, '0')
```

**Prioridad de corrección:** ALTA

---

## VULN-007 — META API PROXY: Sin autenticación, CORS abierto, SSRF potencial

**Gravedad:** CRÍTICA  
**Archivos:** `supabase/functions/meta-api-proxy/index.ts`

### Descripción técnica

```typescript
const cors = {
  "Access-Control-Allow-Origin": "*",  // Abierto a cualquier origen
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  // No hay autenticación
  const { endpoint, params = {} } = await req.json()
  
  case "campaign_insights":
    url = `${BASE}/${params.campaign_id}/insights?...&access_token=${ACCESS_TOKEN}`
    // params.campaign_id sin validar → URL injection
```

**Vectores de ataque:**

1. **Abuso sin autenticación**: La URL de la función es predecible y el código está en el repositorio. Cualquiera puede llamar al proxy y consumir la API de Meta con el access_token de la empresa.

2. **Campaign insights injection**: `params.campaign_id` se interpola directamente en la URL. Si `params.campaign_id = "me/adaccounts"`, la URL resultante es `https://graph.facebook.com/v22.0/me/adaccounts/insights?...`. SSRF limitado a la API de Meta, pero permite enumerar datos de la cuenta.

3. **Create campaign sin restricción**: El endpoint `create_campaign` puede crear campañas reales con el budget de la empresa.

### Reproducción

```bash
# Crear campaña real gastando dinero
curl -X POST 'https://ezxfgawujagatrqylyvo.supabase.co/functions/v1/meta-api-proxy' \
  -H 'Content-Type: application/json' \
  -d '{"endpoint": "create_campaign", "params": {"name": "hack", "objective": "REACH", "daily_budget": "100000"}}'
```

### Solución

```typescript
// Verificar que el request viene de un usuario admin autenticado
const authHeader = req.headers.get('Authorization')
const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', ''))
if (!user) return new Response('Unauthorized', { status: 401 })

// Validar campaign_id
if (params.campaign_id && !/^\d+$/.test(params.campaign_id)) {
  return new Response('Invalid campaign_id', { status: 400 })
}
```

**Prioridad de corrección:** INMEDIATA

---

## VULN-008 — META WEBHOOK: Sin verificación de firma

**Gravedad:** ALTA  
**Archivos:** `supabase/functions/meta-webhook/index.ts`

### Descripción técnica

Meta envía el header `X-Hub-Signature-256: sha256=<hmac>` en cada webhook. El handler no lo verifica:

```typescript
if (req.method === "POST") {
  const body = await req.json()
  // Sin verificar X-Hub-Signature-256
  for (const entry of body.entry ?? []) { ... }
```

### Impacto

Cualquier persona puede enviar POST al endpoint con datos falsos de leads:

```bash
curl -X POST '<webhook_url>' \
  -H 'Content-Type: application/json' \
  -d '{"entry":[{"changes":[{"field":"leadgen","value":{"leadgen_id":"fake123","form_id":"f1","ad_id":"a1","adset_id":"as1","campaign_id":"c1","page_id":"p1"}}]}]}'
```

Esto inserta leads falsos en la tabla `meta_leads`, contamina los datos de CRM y puede disparar flujos de seguimiento hacia números falsos.

### Solución

```typescript
const signature = req.headers.get('X-Hub-Signature-256') ?? ''
const body = await req.text()
const expected = 'sha256=' + await hmacSha256(body, Deno.env.get('META_APP_SECRET') ?? '')
if (signature !== expected) return new Response('Forbidden', { status: 403 })
```

**Prioridad de corrección:** ALTA

---

## VULN-009 — SUPABASE ANON KEY hardcodeada en repositorio público

**Gravedad:** ALTA  
**Archivos:** `ViaGo/utils/supabaseClient.js:2-3`

### Descripción técnica

```javascript
const SUPABASE_URL = 'https://ezxfgawujagatrqylyvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eGZnYXd1amFnYXRycXlseXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODQwMDEsImV4cCI6MjA5MjY2MDAwMX0.KLda0-iEnFWrN90GMzlkpZrC3d_aGVJUjnuhBP3EcuQ';
```

La anon key es un JWT con `"role": "anon"` y expira en 2092. Está en git history permanentemente y se puede extraer de GitHub aunque el repositorio se haga privado después.

**Esta key es la llave de entrada a todas las vulnerabilidades anteriores.**

### Contexto importante

Para apps frontend con Supabase, la anon key es pública por diseño (similar a una API key de solo lectura). La seguridad recae 100% en RLS. El problema es que las RLS policies de este sistema son deficientes (VULN-001 a VULN-004).

**Corrección real:** La anon key en sí no es el problema. El problema es que las RLS policies permiten demasiado. Corregir las vulnerabilidades anteriores hace irrelevante la exposición de esta key.

**Prioridad de corrección:** Baja (la key es pública por diseño; corregir RLS es el fix real)

---

## VULN-010 — Sin Content Security Policy

**Gravedad:** MEDIA  
**Archivos:** `ViaGo/index.html`, `ViaGo/client.html`, `docs/repartidor.html`

### Descripción técnica

Las tres apps cargan scripts de múltiples CDNs externos sin CSP:
- `resource.trickle.so` (React, ReactDOM, Babel)
- `cdn.jsdelivr.net` (Supabase)
- `unpkg.com` (Leaflet, Babel)
- `cdn.tailwindcss.com`

Sin CSP, un CDN comprometido puede inyectar código arbitrario que roba tokens, datos de clientes, y credenciales.

Además, el uso de `@babel/standalone` en producción significa que el código JSX se transpila en el browser. Babel standalone pesa ~1.5MB y es una superficie de ataque adicional.

### Solución

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://resource.trickle.so https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://unpkg.com 'unsafe-eval';
  connect-src 'self' https://*.supabase.co https://graph.facebook.com;
  img-src 'self' data: https:;
">
```

**Prioridad de corrección:** MEDIA

---

## VULN-011 — Referral codes predecibles y enumerables

**Gravedad:** MEDIA  
**Archivos:** `ViaGo/utils/dataService.js:146`

### Descripción técnica

```javascript
_genReferralCode(code) { return code.replace('NAT-', '') + '-REF'; }
```

Cliente `NAT-001` tiene código `001-REF`. Cliente `NAT-042` tiene `042-REF`. Un atacante puede:

1. Enumerar todos los códigos de referido del 001-REF al 999-REF
2. Crear una cuenta nueva con `referredBy = '042-REF'`
3. La función `createClient` llama a `addPoints(clientData.referredBy, cfg.referralBonus, ...)`
4. El referidor legítimo recibe puntos sin haber referido a nadie

Más aún: `createClient` no verifica que el código referidor pertenezca a un cliente activo antes de llamar a `getClientByReferral`. Si no existe, simplemente no hace nada, pero si existe, abusa del sistema de referidos.

### Solución

Generar códigos de referido con entropía suficiente:

```javascript
_genReferralCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => b.toString(36)).join('').toUpperCase();
}
```

**Prioridad de corrección:** MEDIA

---

## VULN-012 — Telegram bot: pending_actions sin TTL

**Gravedad:** BAJA  
**Archivos:** `agents/main.py:22`

### Descripción técnica

```python
pending_actions: dict = {}
```

Dict global en memoria. Si el dueño propone una acción (con ⚠️) y nunca la confirma ni rechaza, queda en memoria indefinidamente. Si el bot se reinicia (deploy en Railway), las acciones pendientes se pierden. El dueño puede presionar "Sí, ejecutar" en un mensaje viejo y no pasa nada, pero la UX es confusa.

### Solución

Agregar TTL de 10 minutos con `time.time()` timestamp y limpiar en cada request:

```python
MAX_PENDING_AGE = 600  # segundos

def cleanup_expired():
    now = time.time()
    expired = [k for k, v in pending_actions.items() if now - v.get('ts', 0) > MAX_PENDING_AGE]
    for k in expired:
        del pending_actions[k]
```

**Prioridad de corrección:** BAJA

---

## Resumen de Superficie de Ataque

| Vector | Autenticación requerida | Severidad |
|--------|------------------------|-----------|
| UPDATE client (cualquier columna) | Token de cliente (recibido por WhatsApp) | CRÍTICA |
| INSERT points_history | Token de cliente | ALTA |
| INSERT orders (cualquier status) | Token de cliente | ALTA |
| READ driver_pin | Ninguna (anon key pública) | CRÍTICA |
| READ admin_password | Ninguna (anon key pública) | CRÍTICA |
| Llamar meta-api-proxy | Ninguna | CRÍTICA |
| POST meta-webhook con datos falsos | Ninguna | ALTA |
| Enumerar referral codes | Ninguna | MEDIA |
| DoS portal (spam de pedidos) | Token de cliente | MEDIA |
