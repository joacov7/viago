"""Supabase tools for NATIVA agents."""

import json
import os
from datetime import datetime, timedelta

from crewai.tools import BaseTool
from supabase import create_client


def _db():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def _fmt_ars(amount: float) -> str:
    return f"${amount:,.0f}".replace(",", ".")


# ── Finance tools ─────────────────────────────────────────────────────────────

class RevenueSummaryTool(BaseTool):
    name: str = "resumen_financiero"
    description: str = (
        "Devuelve facturación, cobrado y pendiente de cobro. "
        "Input: 'hoy', 'semana' o 'mes' (default: mes)."
    )

    def _run(self, period: str = "mes") -> str:
        db = _db()
        now = datetime.now()
        if period == "hoy":
            start = now.strftime("%Y-%m-%d")
        elif period == "semana":
            start = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        else:
            start = now.strftime("%Y-%m-01")

        rows = db.table("invoices").select("total, payment_status, payment_method").gte("created_at", start).execute().data
        billed = sum(r["total"] or 0 for r in rows)
        paid = sum(r["total"] or 0 for r in rows if r["payment_status"] == "pagado")
        pending = billed - paid
        by_method = {}
        for r in rows:
            if r["payment_status"] == "pagado":
                m = r["payment_method"] or "efectivo"
                by_method[m] = by_method.get(m, 0) + (r["total"] or 0)

        return json.dumps({
            "periodo": period,
            "facturado": _fmt_ars(billed),
            "cobrado": _fmt_ars(paid),
            "pendiente_cobro": _fmt_ars(pending),
            "por_metodo_pago": {k: _fmt_ars(v) for k, v in by_method.items()},
            "cantidad_facturas": len(rows),
        }, ensure_ascii=False)


class PendingInvoicesTool(BaseTool):
    name: str = "facturas_pendientes"
    description: str = "Lista las facturas sin cobrar, ordenadas por monto. Incluye nombre y teléfono del cliente."

    def _run(self) -> str:
        db = _db()
        rows = db.table("invoices").select("number, total, created_at, client_id").eq("payment_status", "pendiente").order("total", desc=True).execute().data
        if not rows:
            return "No hay facturas pendientes."
        client_ids = list({r["client_id"] for r in rows})
        clients = {c["id"]: c for c in db.table("clients").select("id, name, phone").in_("id", client_ids).execute().data}
        result = []
        for r in rows:
            c = clients.get(r["client_id"], {})
            result.append({
                "factura": r["number"],
                "monto": _fmt_ars(r["total"] or 0),
                "cliente": c.get("name", "?"),
                "telefono": c.get("phone", ""),
                "fecha": r["created_at"][:10] if r["created_at"] else "",
            })
        return json.dumps({"total_pendiente": _fmt_ars(sum(r["total"] or 0 for r in rows)), "facturas": result[:15]}, ensure_ascii=False)


class ProductMarginsTool(BaseTool):
    name: str = "margenes_productos"
    description: str = "Muestra precio de venta, costo estimado y margen por producto."

    def _run(self) -> str:
        db = _db()
        products = db.table("products").select("name, price, cost").execute().data
        result = []
        for p in products:
            price = p.get("price") or 0
            cost = p.get("cost") or 0
            margin = ((price - cost) / price * 100) if price > 0 else 0
            result.append({
                "producto": p["name"],
                "precio_venta": _fmt_ars(price),
                "costo": _fmt_ars(cost),
                "margen": f"{margin:.1f}%",
            })
        return json.dumps(result, ensure_ascii=False)


# ── Operations tools ──────────────────────────────────────────────────────────

class TodayOrdersTool(BaseTool):
    name: str = "pedidos_hoy"
    description: str = "Lista los pedidos de hoy con estado, cliente, zona y total."

    def _run(self) -> str:
        db = _db()
        today = datetime.now().strftime("%Y-%m-%d")
        orders = db.table("orders").select("id, status, total, client_id").eq("delivery_date", today).execute().data
        if not orders:
            return "No hay pedidos para hoy."
        client_ids = list({o["client_id"] for o in orders})
        clients = {c["id"]: c for c in db.table("clients").select("id, name, zone_id").in_("id", client_ids).execute().data}
        zones = {z["id"]: z["name"] for z in db.table("zones").select("id, name").execute().data}
        by_status = {"pendiente": [], "entregado": [], "cancelado": []}
        for o in orders:
            c = clients.get(o["client_id"], {})
            zone_name = zones.get(c.get("zone_id"), "Sin zona")
            entry = {"cliente": c.get("name", "?"), "zona": zone_name, "total": _fmt_ars(o["total"] or 0)}
            by_status.get(o["status"], by_status["pendiente"]).append(entry)
        return json.dumps({
            "fecha": today,
            "resumen": {k: len(v) for k, v in by_status.items()},
            "total_cobrar": _fmt_ars(sum(o["total"] or 0 for o in orders if o["status"] != "cancelado")),
            "por_estado": by_status,
        }, ensure_ascii=False)


class InactiveClientsTool(BaseTool):
    name: str = "clientes_inactivos"
    description: str = (
        "Clientes sin pedidos en los últimos N días. "
        "Input: número de días (default: 30)."
    )

    def _run(self, days: str = "30") -> str:
        db = _db()
        cutoff = (datetime.now() - timedelta(days=int(days))).strftime("%Y-%m-%d")
        clients = db.table("clients").select("id, name, phone, code").eq("active", True).execute().data
        recent_orders = db.table("orders").select("client_id").gte("delivery_date", cutoff).execute().data
        recent_ids = {r["client_id"] for r in recent_orders}
        inactive = [c for c in clients if c["id"] not in recent_ids]
        return json.dumps({
            "dias_sin_pedido": int(days),
            "total_inactivos": len(inactive),
            "clientes": [{"nombre": c["name"], "telefono": c.get("phone", ""), "codigo": c.get("code", "")} for c in inactive[:20]],
        }, ensure_ascii=False)


class ZoneStatsTool(BaseTool):
    name: str = "estadisticas_zonas"
    description: str = "Pedidos y clientes activos por zona en el mes actual."

    def _run(self) -> str:
        db = _db()
        month_start = datetime.now().strftime("%Y-%m-01")
        zones = db.table("zones").select("id, name").execute().data
        clients = db.table("clients").select("id, zone_id").eq("active", True).execute().data
        orders = db.table("orders").select("client_id, total, status").gte("delivery_date", month_start).execute().data

        clients_by_zone = {}
        for c in clients:
            zid = c["zone_id"]
            clients_by_zone[zid] = clients_by_zone.get(zid, 0) + 1

        client_to_zone = {c["id"]: c["zone_id"] for c in clients}
        orders_by_zone = {}
        revenue_by_zone = {}
        for o in orders:
            zid = client_to_zone.get(o["client_id"])
            if zid:
                orders_by_zone[zid] = orders_by_zone.get(zid, 0) + 1
                if o["status"] == "entregado":
                    revenue_by_zone[zid] = revenue_by_zone.get(zid, 0) + (o["total"] or 0)

        result = []
        for z in zones:
            result.append({
                "zona": z["name"],
                "clientes_activos": clients_by_zone.get(z["id"], 0),
                "pedidos_mes": orders_by_zone.get(z["id"], 0),
                "facturado_mes": _fmt_ars(revenue_by_zone.get(z["id"], 0)),
            })
        return json.dumps(sorted(result, key=lambda x: x["pedidos_mes"], reverse=True), ensure_ascii=False)


# ── Marketing tools ───────────────────────────────────────────────────────────

class TopClientsTool(BaseTool):
    name: str = "top_clientes"
    description: str = "Los N clientes con mayor volumen de compra en el mes. Input: número (default: 10)."

    def _run(self, n: str = "10") -> str:
        db = _db()
        month_start = datetime.now().strftime("%Y-%m-01")
        orders = db.table("orders").select("client_id, total").eq("status", "entregado").gte("delivery_date", month_start).execute().data
        totals = {}
        for o in orders:
            totals[o["client_id"]] = totals.get(o["client_id"], 0) + (o["total"] or 0)
        top_ids = sorted(totals, key=lambda x: totals[x], reverse=True)[:int(n)]
        if not top_ids:
            return "Sin datos de ventas este mes."
        clients = {c["id"]: c for c in db.table("clients").select("id, name, phone, code").in_("id", top_ids).execute().data}
        result = [{"cliente": clients[cid]["name"], "facturado": _fmt_ars(totals[cid]), "telefono": clients[cid].get("phone", "")} for cid in top_ids if cid in clients]
        return json.dumps(result, ensure_ascii=False)


# ── Write tools (require user confirmation before running) ────────────────────

class GenerateWAOfferTool(BaseTool):
    name: str = "generar_oferta_whatsapp"
    description: str = (
        "Genera los mensajes de WhatsApp para una campaña. "
        "Input JSON: {\"clients\": [{\"name\": \"...\", \"phone\": \"...\"}], \"message\": \"...\"}. "
        "Devuelve los links wa.me listos para enviar."
    )

    def _run(self, input_data: str) -> str:
        data = json.loads(input_data)
        clients = data.get("clients", [])
        message = data.get("message", "")
        links = []
        for c in clients:
            phone = (c.get("phone") or "").replace("+", "").replace(" ", "").replace("-", "")
            if not phone:
                continue
            personalized = message.replace("{nombre}", c["name"].split()[0])
            url = f"https://wa.me/{phone}?text={personalized}"
            links.append({"cliente": c["name"], "link": url})
        return json.dumps({"cantidad": len(links), "mensajes": links}, ensure_ascii=False)


class CreateOrdersBulkTool(BaseTool):
    name: str = "crear_pedidos_masivos"
    description: str = (
        "Crea pedidos en el sistema para varios clientes. "
        "Input JSON: {\"client_ids\": [1,2,3], \"product_id\": 1, \"quantity\": 1, \"date\": \"YYYY-MM-DD\", \"notes\": \"...\"}."
    )

    def _run(self, input_data: str) -> str:
        data = json.loads(input_data)
        db = _db()
        product = db.table("products").select("id, name, price").eq("id", data["product_id"]).single().execute().data
        if not product:
            return "Producto no encontrado."
        qty = int(data.get("quantity", 1))
        item = {"productId": product["id"], "productName": product["name"], "price": product["price"], "quantity": qty, "subtotal": product["price"] * qty}
        date = data.get("date") or datetime.now().strftime("%Y-%m-%d")
        created = 0
        for cid in data["client_ids"]:
            db.table("orders").insert({
                "client_id": cid,
                "delivery_date": date,
                "items": [item],
                "total": item["subtotal"],
                "status": "pendiente",
                "notes": data.get("notes", ""),
            }).execute()
            created += 1
        return json.dumps({"pedidos_creados": created, "producto": product["name"], "fecha": date}, ensure_ascii=False)


class MarkInvoicePaidTool(BaseTool):
    name: str = "marcar_factura_pagada"
    description: str = (
        "Marca una factura como pagada. "
        "Input JSON: {\"invoice_id\": 123, \"payment_method\": \"efectivo\"}."
    )

    def _run(self, input_data: str) -> str:
        data = json.loads(input_data)
        db = _db()
        db.table("invoices").update({
            "payment_status": "pagado",
            "payment_method": data.get("payment_method", "efectivo"),
            "paid_at": datetime.now().isoformat(),
        }).eq("id", data["invoice_id"]).execute()
        return json.dumps({"ok": True, "factura_id": data["invoice_id"]}, ensure_ascii=False)

