import { currentUser } from "@/lib/auth";
import { badgesFor } from "@/lib/badges";

/** Fresh tab-bar numbers; the bar asks after every page change, so badges clear once you've looked. */
export async function GET() {
  const user = await currentUser();
  if (!user || !user.approved) return new Response(null, { status: 401 });
  return Response.json((await badgesFor(user)).badges, { headers: { "cache-control": "no-store" } });
}
