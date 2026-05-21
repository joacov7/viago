import { serve }        from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ACCESS_TOKEN  = Deno.env.get("META_ACCESS_TOKEN")  ?? ""
const AD_ACCOUNT_ID = Deno.env.get("META_AD_ACCOUNT_ID") ?? ""
const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")       ?? ""
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const VER  = "v22.0"
const BASE = `https://graph.facebook.com/${VER}`

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } })

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  // ─── Auth: require valid Supabase session ─────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? ""
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401)

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.slice(7))
  if (authErr || !user) return json({ error: "Unauthorized" }, 401)
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const { endpoint, params = {} } = await req.json()

    // Validate numeric IDs to prevent URL injection
    const assertNumericId = (val: unknown, field: string) => {
      if (val !== undefined && !/^\d+$/.test(String(val)))
        throw new Error(`Invalid ${field}`)
    }
    assertNumericId(params.campaign_id, "campaign_id")

    let url: string
    let method = "GET"
    let body: string | undefined

    switch (endpoint) {
      case "campaigns":
        url = `${BASE}/${AD_ACCOUNT_ID}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${ACCESS_TOKEN}`
        break

      case "account_insights":
        url = `${BASE}/${AD_ACCOUNT_ID}/insights?fields=impressions,clicks,spend,reach,ctr,cpc,actions&date_preset=${
          params.date_preset ?? "last_30d"
        }&access_token=${ACCESS_TOKEN}`
        break

      case "campaign_insights":
        url = `${BASE}/${params.campaign_id}/insights?fields=impressions,clicks,spend,reach,ctr,cpc,actions&date_preset=${
          params.date_preset ?? "last_30d"
        }&access_token=${ACCESS_TOKEN}`
        break

      case "create_campaign": {
        url = `${BASE}/${AD_ACCOUNT_ID}/campaigns`
        method = "POST"
        const p = new URLSearchParams({
          name:                   String(params.name ?? ""),
          objective:              String(params.objective ?? ""),
          status:                 String(params.status ?? "PAUSED"),
          special_ad_categories:  "[]",
          access_token:           ACCESS_TOKEN,
        })
        if (params.daily_budget) p.set("daily_budget", String(params.daily_budget))
        body = p.toString()
        break
      }

      case "update_campaign":
        assertNumericId(params.campaign_id, "campaign_id")
        url = `${BASE}/${params.campaign_id}`
        method = "POST"
        body = new URLSearchParams({
          status:       String(params.status ?? ""),
          access_token: ACCESS_TOKEN,
        }).toString()
        break

      default:
        return json({ error: "unknown endpoint" }, 400)
    }

    const res = await fetch(url, {
      method,
      headers: method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {},
      body,
    })
    const data = await res.json()
    return json(data)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
