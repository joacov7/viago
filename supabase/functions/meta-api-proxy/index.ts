import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ACCESS_TOKEN  = Deno.env.get("META_ACCESS_TOKEN")  ?? ""
const AD_ACCOUNT_ID = Deno.env.get("META_AD_ACCOUNT_ID") ?? ""
const VER  = "v22.0"
const BASE = `https://graph.facebook.com/${VER}`

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const { endpoint, params = {} } = await req.json()
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
          name:                   params.name,
          objective:              params.objective,
          status:                 params.status ?? "PAUSED",
          special_ad_categories:  "[]",
          access_token:           ACCESS_TOKEN,
        })
        if (params.daily_budget) p.set("daily_budget", params.daily_budget)
        body = p.toString()
        break
      }

      case "update_campaign":
        url = `${BASE}/${params.campaign_id}`
        method = "POST"
        body = new URLSearchParams({
          status:       params.status,
          access_token: ACCESS_TOKEN,
        }).toString()
        break

      default:
        return new Response(JSON.stringify({ error: "unknown endpoint" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        })
    }

    const res = await fetch(url, {
      method,
      headers: method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {},
      body,
    })
    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
