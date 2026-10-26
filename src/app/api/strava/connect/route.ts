import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser, newToken } from "@/lib/auth";
import { authorizeUrl, stravaConfigured } from "@/lib/strava";

export async function GET() {
  if (!(await currentUser())) redirect("/login");
  if (!stravaConfigured()) redirect("/meg?strava=mangler");
  const state = newToken(12);
  (await cookies()).set("sb_strava_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  redirect(authorizeUrl(state));
}
