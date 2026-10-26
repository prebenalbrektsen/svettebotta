import { startSession } from "@/lib/auth";
import { verifyLogin } from "@/lib/passkeys";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = await verifyLogin(body.token, body.response).catch(() => null);
  if (!userId) return Response.json({ error: "Fant ingen konto for denne Face ID-en / passkeyen. Logg inn med passord og slå den på under Meg." }, { status: 400 });
  await startSession(userId);
  return Response.json({ redirect: "/" });
}
