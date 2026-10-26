import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { activeChallenge } from "@/lib/challenge";
import { connectStrava, syncStrava } from "@/lib/strava";
import { addDays, osloDate } from "@/lib/time";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const url = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get("sb_strava_state")?.value;
  jar.delete("sb_strava_state");
  const code = url.searchParams.get("code");
  const scope = url.searchParams.get("scope") ?? "";
  if (!code || !expected || url.searchParams.get("state") !== expected) redirect("/meg?strava=feil");
  // People can untick "private activities" on Strava's screen; we need at least read access.
  if (!scope.includes("activity:read")) redirect("/meg?strava=tilgang");

  let ok = true;
  try {
    await connectStrava(user.id, code);
    const c = await activeChallenge();
    await syncStrava(user.id, new Date(`${c ? addDays(c.starts_on, -7) : osloDate()}T00:00:00Z`));
  } catch (e) {
    console.error(e);
    ok = false;
  }
  redirect(ok ? "/meg?strava=ok" : "/meg?strava=feil");
}
