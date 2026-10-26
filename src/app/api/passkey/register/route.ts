import { currentUser } from "@/lib/auth";
import { register } from "@/lib/passkeys";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Ikke innlogget" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ok = await register(user.id, body.token, body.response, String(body.name ?? "")).catch(() => false);
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Kunne ikke lagre. Prøv igjen." }, { status: 400 });
}
