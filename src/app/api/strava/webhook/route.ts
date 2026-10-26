import { after } from "next/server";
import { handleWebhookEvent, webhookVerifyToken } from "@/lib/strava";

// Strava's webhook. GET = the one-time check when the subscription is created; POST = an event
// (new/changed/deleted activity, or someone revoking access). Strava wants an answer within two
// seconds, so the actual work runs after the response.

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  if (q.get("hub.mode") !== "subscribe" || q.get("hub.verify_token") !== webhookVerifyToken()) {
    return Response.json({ error: "Ugyldig" }, { status: 403 });
  }
  return Response.json({ "hub.challenge": q.get("hub.challenge") });
}

export async function POST(request: Request) {
  const event = await request.json().catch(() => null);
  if (event?.object_type && event?.owner_id) {
    after(() => handleWebhookEvent(event).catch((e) => console.error("[strava webhook]", e)));
  }
  return new Response("ok");
}
