import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

/** Saves (POST) or removes (DELETE) this device's push subscription. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return new Response(null, { status: 401 });
  const sub = await request.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return Response.json({ error: "Ugyldig" }, { status: 400 });
  await query(
    `insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, $3, $4)
     on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    [user.id, sub.endpoint, sub.keys.p256dh, sub.keys.auth],
  );
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return new Response(null, { status: 401 });
  const { endpoint } = await request.json().catch(() => ({}));
  await query("delete from push_subscriptions where endpoint = $1 and user_id = $2", [endpoint, user.id]);
  return Response.json({ ok: true });
}
