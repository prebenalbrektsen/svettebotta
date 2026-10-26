import { redirect } from "next/navigation";
import { currentUser, newToken } from "@/lib/auth";
import { query } from "@/lib/db";
import { authorizeUrl, stravaConfigured } from "@/lib/strava";

// The state token is stored with the user's id, so the callback knows who it is even when Strava
// sends them back in another browser (iPhone home-screen apps and Safari don't share cookies).
export async function GET() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!stravaConfigured()) redirect("/meg?strava=mangler");
  const state = newToken(18);
  await query("delete from oauth_states where expires_at < now()");
  await query("insert into oauth_states (token, user_id, expires_at) values ($1, $2, now() + interval '20 minutes')", [state, user.id]);
  redirect(authorizeUrl(state));
}
