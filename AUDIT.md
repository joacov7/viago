# NATIVA — Auditoría General del Sistema

> Auditoría realizada el 2026-05-21. Modalidad: análisis estático completo de todos los archivos
> del repositorio (frontend, backend, edge functions, agentes IA, esquema de BD, RLS, CI/CD, PWA).
> No se realizaron pruebas en vivo contra producción.

---

## Resumen Ejecutivo

NATIVA es un sistema de gestión para distribución de agua compuesto por:
- Admin SPA (React/Babel sin build, GitHub Pages)
- Portal del cliente (SPA separada, token en URL)
- App del repartidor (PWA, PIN en config pública)
- Agentes IA (CrewAI + Telegram, Railway)
- Edge functions Supabase (proxy Meta API, webhook leads)
- Supabase como único backend (RLS como capa de seguridad)

**El sistema tiene vulnerabilidades críticas activas que permiten fraude de puntos, manipulación de saldos, lectura del PIN del repartidor, bypass total de autorización en el portal del cliente y pérdida silenciosa de datos a partir de cierta escala. Varias de estas vulnerabilidades son explotables ahora mismo con la anon key que está hardcodeada en el repositorio público.**

---

## Score General

| Dimensión | Score | Estado |
|---|---|---|
| Seguridad | 2/10 | CRÍTICO |
| Integridad de datos | 3/10 | CRÍTICO |
| Concurrencia | 2/10 | CRÍTICO |
| Escalabilidad | 3/10 | ALTO RIESGO |
| Arquitectura | 4/10 | ALTO RIESGO |
| Manejo de errores | 3/10 | ALTO RIESGO |
| Performance | 4/10 | MEDIO |
| Observabilidad | 1/10 | CRÍTICO |
| Testing | 0/10 | INEXISTENTE |
| **SCORE GLOBAL** | **2.5/10** | **PRODUCCIÓN COMPROMETIDA** |

---

## Problemas por Prioridad

### PRIORIDAD 1 — Críticos (corregir antes de siguiente deploy)

1. CLIENT SELF-UPDATE SIN RESTRICCIÓN DE COLUMNAS → fraude de puntos y saldo
2. CLIENT POINTS INSERT → inserción libre de puntos
3. CLIENT ORDERS INSERT sin restricción de status → triggers puntos fraudulentos
4. DRIVER PIN expuesto vía política anon de config
5. admin_password expuesto vía política anon de config
6. Race condition no-atómica en puntos, saldo, números de factura y código de cliente
7. PostgREST trunca silenciosamente a 1000 filas → dashboard con datos incorrectos
8. Sin transacciones → estados inconsistentes garantizados a escala
9. Meta API proxy sin autenticación ni validación → SSRF + gasto no autorizado
10. Meta webhook sin verificación de firma → leads falsos masivos

### PRIORIDAD 2 — Altos (sprint siguiente)

11. Repartidor app: cuenta_corriente ausente en PayCollectModal
12. UTC vs hora local en scheduler de campañas
13. WhatsApp links sin URL encoding en tools.py
14. Service Worker con nombres de archivo incorrectos (cache versionada no matchea)
15. Sin rate limiting en ningún endpoint
16. Sin CSP en ninguna página
17. Codebase duplicado docs/ViaGo sin CI que garantice sincronía
18. Supabase service key en scheduler.py sin restricción de operaciones

### PRIORIDAD 3 — Medios (deuda técnica)

19. JSONB `items` almacenado en camelCase en DB
20. Referral codes predecibles (trivialmente enumerables)
21. getOrders/getClients sin paginación → timeout con datos reales
22. getDashboardStats carga todo en memoria del browser
23. Backup.js importa sin validación de schema
24. Memory leak en `pending_actions` del bot Telegram
25. `image_url` de productos ausente en schema inicial
26. GPS watchPosition sin auto-stop ni throttling

### PRIORIDAD 4 — Deuda estructural

27. Cero tests (unitarios, integración, E2E)
28. Cero observabilidad estructurada (logs, métricas, alertas)
29. Un solo conductor soportado en driver_locations
30. Config caché global compartido entre sesiones en DataService

---

## Riesgos Críticos Inmediatos

### Fraude activo en el portal del cliente

Un cliente con su token (recibido por WhatsApp) puede hoy mismo:

```
PATCH https://ezxfgawujagatrqylyvo.supabase.co/rest/v1/clients?id=eq.<su_id>
Authorization: Bearer <anon_key>
x-client-token: <su_token>
{"points": 999999, "balance": -5000}
```

La política `client_self_update` no restringe columnas. No hay servidor intermedio que valide.

También puede insertar en `points_history` con cualquier valor:

```
POST /rest/v1/points_history
{"client_id": <su_id>, "points": 99999, "action": "earned", "description": "hack"}
```

Esto no actualiza `clients.points` (eso lo hace `addPoints`), pero sí el historial visible.

Y puede crear pedidos con status ya entregado:
```
POST /rest/v1/orders
{"client_id": <su_id>, "status": "entregado", ...}
```
Esto no dispara `wasDelivered` en `updateOrder` (porque se crea directamente), pero sí en el admin cuando el admin edita el pedido.

### PIN del repartidor legible sin autenticación

```
GET https://ezxfgawujagatrqylyvo.supabase.co/rest/v1/config?id=eq.1&select=driver_pin,admin_password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eGZnYXd1amFnYXRycXlseXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODQwMDEsImV4cCI6MjA5MjY2MDAwMX0.KLda0-iEnFWrN90GMzlkpZrC3d_aGVJUjnuhBP3EcuQ
```

Esta key está en el repositorio. El driver PIN y admin_password son accesibles públicamente.

---

## Riesgos Futuros de Escalabilidad

- Con 500+ clientes: `getClients()` ya silenciosamente devuelve solo 1000 (PostgREST limit) → dashboard muestra datos incorrectos sin ningún warning
- Con 1000+ pedidos: `getOrders()`, `getDashboardStats()` y `getInactiveClients()` cargan todo en memoria del browser → timeout / OOM
- Con alta concurrencia: race conditions en puntos y facturas producen duplicados o pérdida garantizada
- Con múltiples repartidores: driver_locations solo soporta id=1 → imposible escalar el reparto
- Con campañas grandes: el scheduler manda Telegram con 4000 links en chunks sin rate limiting → bot baneado

---

## Riesgos Operativos

- Codebase duplicado (ViaGo/ + docs/): cualquier fix urgente requiere doble edición manual. Ya hubo divergencias durante el desarrollo (Backup.js, Delivery.js). Sin CI que sincronice, el producción puede estar desactualizado sin que nadie lo note.
- Backup almacena timestamp en localStorage del browser: si el admin usa otro browser o device, nunca sabe cuándo fue el último backup real.
- Backup import sin validación: un archivo malformado o de otra instancia puede corromper todos los datos de producción (upsert por ID, no hay rollback).
- Scheduler con `max_workers=2`: si OpenAI está lento, el bot queda bloqueado. El scheduler (que corre en el mismo proceso) también se bloquea → campañas no se disparan.

---

## Riesgos Financieros / Comerciales

- El proxy de Meta API sin autenticación puede ser descubierto (la URL está en el código del repositorio). Un atacante puede hacer peticiones usando el access_token de la empresa, modificar campañas, crear campañas con gasto, o simplemente consumir el budget de Meta.
- La herramienta `MarkInvoicePaidTool` del agente IA puede marcar facturas como pagadas sin cobro real. El agente CEO puede aprobar esto sin confirmación explícita del dueño (la confirmación es por texto con ⚠️, lo cual el LLM puede decidir no incluir).
- Race condition en `processReferralReward`: dos facturas marcadas pagadas simultáneamente pueden dar doble descuento de referido y doble recompensa al referidor.

---

## Recomendaciones de Arquitectura

1. **Eliminar la duplicación ViaGo/docs/**: usar un step de CI (GitHub Actions) que copie ViaGo/ → docs/ automáticamente en cada push. Nunca editar docs/ a mano.
2. **Mover lógica de negocio al servidor**: las operaciones críticas (puntos, saldo, facturas) deben ejecutarse en Edge Functions con service_role, no desde el frontend con anon key.
3. **Eliminar operaciones no-atómicas**: usar stored procedures en PostgreSQL (`PERFORM` + `BEGIN/COMMIT`) para ajustes de puntos y saldo. PostgREST soporta RPC.
4. **Paginación obligatoria**: todas las queries deben tener `.range()` o `.limit()` explícito. Nunca cargar todo en memoria.
5. **Separar supabaseClient por contexto**: el admin app y el portal del cliente comparten el mismo `SupabaseDB` singleton. Deberían tener clientes separados con comportamientos distintos.

---

## Roadmap de Mejoras

### Semana 1 (emergencias de seguridad)
- Restringir columnas actualizables por cliente vía Edge Function
- Eliminar admin_password del esquema de config
- Mover driver_pin fuera del config público (tabla separada con RLS auth-only)
- Agregar verificación de firma en meta-webhook
- Agregar autenticación en meta-api-proxy (apikey header verificado contra config)

### Semana 2 (integridad de datos)
- Convertir addPoints, adjustClientBalance a stored procedures atómicos
- Convertir _genInvoiceNumber y _genClientCode a sequences de PostgreSQL
- Agregar `.limit()` / paginación a todas las queries
- Fix: client_orders_insert debe forzar status='pendiente'

### Semana 3 (arquitectura)
- CI que sincroniza ViaGo/ → docs/ automáticamente
- Fix service worker cache names para que coincidan con URLs versionadas
- Agregar Content-Security-Policy en ambas apps

### Mes 2 (calidad)
- Test suite básico (al menos happy path de DataService)
- Observabilidad: Sentry en frontend, structured logging en agents
- Rate limiting en portal del cliente
- Paginación en todos los listados admin

---

## Quick Wins (< 1 hora cada uno)

1. Borrar `admin_password` del schema de config (es campo muerto y expone superficie)
2. Agregar `WITH CHECK (status = 'pendiente')` en `client_orders_insert` RLS policy
3. Reemplazar `client_self_update` con columnas específicas: `WITH CHECK (access_token = get_client_token())` y restringir a `email`, `phone`, `address`
4. Agregar `?select=company_name,tagline,primary_color,...` en `public_config` policy (row filter no restringe columnas, pero sí se puede en la query del frontend)
5. Agregar `Content-Type: application/json` validation en meta-api-proxy antes del switch
6. Fix UTC en scheduler: cambiar `datetime.utcnow()` a `datetime.now()`
7. URL-encode el mensaje en `GenerateWAOfferTool`
8. Agregar `cuenta_corriente` al repartidor-app PayCollectModal
9. Cambiar `CACHE = 'nativa-client-v2'` en service worker para forzar re-cache

---

## Checklist de Correcciones

### Seguridad
- [ ] Restringir `client_self_update` a columnas no-sensibles
- [ ] Eliminar `client_points_insert` RLS policy (mover a Edge Function)
- [ ] Forzar `status='pendiente'` en `client_orders_insert`
- [ ] Mover driver_pin a tabla auth-only
- [ ] Eliminar admin_password de config
- [ ] Agregar X-Hub-Signature-256 verification en meta-webhook
- [ ] Agregar autenticación en meta-api-proxy
- [ ] Validar/sanitizar params.campaign_id en meta-api-proxy
- [ ] CSP headers en index.html y client.html

### Integridad de datos
- [ ] Stored procedure atómico para addPoints
- [ ] Stored procedure atómico para adjustClientBalance
- [ ] Sequence de PostgreSQL para invoice number
- [ ] Sequence de PostgreSQL para client code
- [ ] Fix race condition en processReferralReward (SELECT FOR UPDATE)
- [ ] Mover side effects post-entrega a Edge Function transaccional

### Escalabilidad
- [ ] Paginación en getOrders, getClients, getInvoices
- [ ] Paginación en getDashboardStats (usar queries agregadas, no client-side)
- [ ] Paginación en getInactiveClients
- [ ] Header range en todas las queries admin

### Operaciones
- [ ] CI que sincroniza ViaGo/ → docs/
- [ ] Fix service worker CACHE version y filenames
- [ ] Rate limiting en creación de pedidos desde portal
- [ ] Backup: validación de schema antes de importar
- [ ] Backup: timestamp en DB, no en localStorage
- [ ] Añadir cuenta_corriente en repartidor-app PayCollectModal
- [ ] Fix UTC/localtime en scheduler de campañas
