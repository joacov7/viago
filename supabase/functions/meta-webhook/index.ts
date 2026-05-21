import { serve }        from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const VERIFY_TOKEN      = Deno.env.get("META_VERIFY_TOKEN")         ?? ""
const PAGE_ACCESS_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN")    ?? ""
const APP_SECRET        = Deno.env.get("META_APP_SECRET")           ?? ""
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")              ?? ""
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

async function hmacSha256(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")
}

serve(async (req) => {
  const url = new URL(req.url)

  // GET — Meta webhook verification handshake
  if (req.method === "GET") {
    const mode      = url.searchParams.get("hub.mode")
    const token     = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 })
    }
    return new Response("Forbidden", { status: 403 })
  }

  // POST — Lead gen event
  if (req.method === "POST") {
    const rawBody = await req.text()

    // ─── Verify X-Hub-Signature-256 ─────────────────────────────────────────
    if (APP_SECRET) {
      const sigHeader = req.headers.get("X-Hub-Signature-256") ?? ""
      const expected  = "sha256=" + await hmacSha256(rawBody, APP_SECRET)
      if (sigHeader !== expected) {
        console.error("Webhook signature mismatch")
        return new Response("Forbidden", { status: 403 })
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const body = JSON.parse(rawBody)
    const db   = createClient(SUPABASE_URL, SERVICE_KEY)

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") continue

        const { leadgen_id, form_id, ad_id, adset_id, campaign_id, page_id } = change.value

        // Fetch lead field data from Meta Graph API
        const leadRes  = await fetch(
          `https://graph.facebook.com/v22.0/${leadgen_id}?fields=field_data,created_time&access_token=${PAGE_ACCESS_TOKEN}`
        )
        const leadData = await leadRes.json()
        if (leadData.error) continue

        const fields: Record<string, string> = {}
        for (const f of leadData.field_data ?? []) {
          fields[f.name] = f.values?.[0] ?? ""
        }

        await db.from("meta_leads").upsert({
          lead_id:    leadgen_id,
          form_id,
          ad_id,
          adset_id,
          campaign_id,
          page_id,
          full_name:  fields["full_name"]    || fields["nombre"]   || "",
          email:      fields["email"]        || "",
          phone:      fields["phone_number"] || fields["telefono"] || "",
          raw_fields: fields,
        }, { onConflict: "lead_id" })
      }
    }

    return new Response("OK", { status: 200 })
  }

  return new Response("Method not allowed", { status: 405 })
})
