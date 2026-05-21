"""Campaign scheduler — runs in background thread alongside the Telegram bot."""

import json
import logging
import os
from datetime import datetime, timedelta, timezone

import requests
from apscheduler.schedulers.background import BackgroundScheduler
from supabase import create_client

logger = logging.getLogger(__name__)


def _db():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def _tg(message: str):
    """Send a Telegram message to the owner (synchronous, safe from threads)."""
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    owner = os.environ["TELEGRAM_OWNER_ID"]
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": owner, "text": message, "parse_mode": "Markdown"},
            timeout=10,
        )
    except Exception as e:
        logger.error("Telegram notify error: %s", e)


def _get_segment_clients(db, segment: str, segment_data: dict) -> list[dict]:
    """Return list of {id, name, phone} for the campaign segment."""
    if segment == "all":
        rows = db.table("clients").select("id, name, phone").eq("active", True).execute().data
        return [r for r in rows if r.get("phone")]

    if segment.startswith("inactive_"):
        days = int(segment.split("_")[1])
        cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        clients = db.table("clients").select("id, name, phone").eq("active", True).execute().data
        recent = {r["client_id"] for r in db.table("orders").select("client_id").gte("delivery_date", cutoff).execute().data}
        return [c for c in clients if c["id"] not in recent and c.get("phone")]

    if segment == "zone":
        zone_id = segment_data.get("zone_id")
        rows = db.table("clients").select("id, name, phone").eq("active", True).eq("zone_id", zone_id).execute().data
        return [r for r in rows if r.get("phone")]

    if segment == "custom":
        ids = segment_data.get("client_ids", [])
        rows = db.table("clients").select("id, name, phone").in_("id", ids).execute().data
        return [r for r in rows if r.get("phone")]

    return []


def _make_wa_link(phone: str, message: str, name: str) -> str:
    phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    personalized = message.replace("{nombre}", name.split()[0])
    import urllib.parse
    return f"https://wa.me/{phone}?text={urllib.parse.quote(personalized)}"


def execute_campaign(campaign_id: int):
    """Fetch campaign, build WA links, record contacts, notify owner."""
    db = _db()
    camp = db.table("campaigns").select("*").eq("id", campaign_id).single().execute().data
    if not camp or camp["status"] != "pending":
        return

    segment_data = camp.get("segment_data") or {}
    clients = _get_segment_clients(db, camp["segment"], segment_data)

    if not clients:
        db.table("campaigns").update({"status": "completed", "clients_targeted": 0}).eq("id", campaign_id).execute()
        _tg(f"📣 Campaña *{camp['name']}*: no se encontraron clientes en el segmento.")
        return

    # Build contacts and WA links
    contacts = []
    wa_lines = []
    for c in clients:
        link = _make_wa_link(c["phone"], camp["message"], c["name"])
        contacts.append({
            "campaign_id": campaign_id,
            "client_id": c["id"],
            "client_name": c["name"],
            "phone": c["phone"],
            "wa_link": link,
        })
        wa_lines.append(f"• [{c['name']}]({link})")

    db.table("campaign_contacts").insert(contacts).execute()
    db.table("campaigns").update({
        "status": "active",
        "clients_targeted": len(clients),
        "clients_contacted": len(clients),
    }).eq("id", campaign_id).execute()

    # Notify owner
    header = f"📣 *Campaña lista: {camp['name']}*\n{len(clients)} clientes — tocá cada link para enviar:\n\n"
    # Telegram has 4096 char limit; split if needed
    chunk, chunks = header, []
    for line in wa_lines:
        if len(chunk) + len(line) + 1 > 4000:
            chunks.append(chunk)
            chunk = ""
        chunk += line + "\n"
    chunks.append(chunk)
    for msg in chunks:
        _tg(msg)


def check_conversions():
    """Daily job: mark campaign contacts as converted if they ordered after contact."""
    db = _db()
    cutoff = (datetime.now() - timedelta(days=1)).isoformat()
    contacts = db.table("campaign_contacts").select("id, campaign_id, client_id, sent_at").eq("converted", False).lt("sent_at", cutoff).execute().data
    converted = 0
    for contact in contacts:
        orders = db.table("orders").select("id").eq("client_id", contact["client_id"]).gte("created_at", contact["sent_at"]).execute().data
        if orders:
            db.table("campaign_contacts").update({"converted": True}).eq("id", contact["id"]).execute()
            converted += 1

    if converted:
        # Update orders_after count per campaign
        campaign_ids = list({c["campaign_id"] for c in contacts})
        for cid in campaign_ids:
            count = db.table("campaign_contacts").select("id", count="exact").eq("campaign_id", cid).eq("converted", True).execute().count
            db.table("campaigns").update({"orders_after": count or 0}).eq("id", cid).execute()
        _tg(f"📊 Conversiones actualizadas: {converted} cliente(s) compraron tras recibir una campaña.")


def check_pending_campaigns():
    """Run every minute: fire any campaigns whose scheduled_at has passed."""
    db = _db()
    now = datetime.now(timezone.utc).isoformat()
    due = db.table("campaigns").select("id").eq("status", "pending").lte("scheduled_at", now).execute().data
    for row in due:
        logger.info("Firing campaign %s", row["id"])
        try:
            execute_campaign(row["id"])
        except Exception as e:
            logger.exception("Campaign %s failed: %s", row["id"], e)


def start_scheduler():
    sched = BackgroundScheduler(timezone="America/Argentina/Buenos_Aires")
    sched.add_job(check_pending_campaigns, "interval", minutes=1, id="campaigns")
    sched.add_job(check_conversions, "cron", hour=8, minute=0, id="conversions")
    sched.start()
    logger.info("Scheduler started")
    return sched
