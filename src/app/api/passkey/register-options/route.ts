import { currentUser } from "@/lib/auth";
import { registrationOptions } from "@/lib/passkeys";

export async function POST() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Ikke innlogget" }, { status: 401 });
  return Response.json(await registrationOptions(user));
}
