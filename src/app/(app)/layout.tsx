import { StayFresh } from "@/components/StayFresh";
import { APP_VERSION } from "@/lib/version";
import Link from "next/link";
import { after } from "next/server";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { requireUser } from "@/lib/auth";
import { announceWeekSummary } from "@/lib/announce";
import { syncStale } from "@/lib/autosync";
import { one, query } from "@/lib/db";
import { activeChallenge, annotate, WORKOUT_COLUMNS, type Workout } from "@/lib/challenge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Keep everyone's Strava workouts fresh without anybody pressing a button.
  after(async () => {
    await syncStale();
    await announceWeekSummary();
  });
  // Everything the tab bar's badges need, in one round trip.
  const counts = (await one<{ avatar_v: number | null; unread: number; activity: number; admin: number }>(
    `select extract(epoch from u.avatar_updated_at)::int as avatar_v,
            (select count(*)::int from messages m where m.created_at > u.chat_seen_at and (m.user_id is null or m.user_id <> u.id)) as unread,
            (select count(*)::int from kudos k join workouts w on w.id = k.workout_id
              where w.user_id = u.id and k.user_id <> u.id and k.created_at > u.activity_seen_at)
          + (select count(*)::int from comments c join workouts w on w.id = c.workout_id
              where w.user_id = u.id and c.user_id <> u.id and c.created_at > u.activity_seen_at) as activity,
            case when u.is_admin then (select count(*)::int from users where not approved) + (select count(*)::int from fines where status = 'claimed') else 0 end as admin
       from users u where u.id = $1`,
    [user.id],
  ))!;
  // Workouts still waiting for check-in (and not too late).
  const c = await activeChallenge();
  const waiting = c
    ? annotate(c, await query<Workout>(
        `select ${WORKOUT_COLUMNS} from workouts where user_id = $1 and checked_in_at is null and not rejected and started_at > now() - interval '8 days'`,
        [user.id],
      )).filter((w) => w.status === "pending").length
    : 0;
  const badges = { "/": counts.activity, "/logg": waiting, "/prat": counts.unread, "/admin": counts.admin };
  const avatar = counts.avatar_v ? `/api/avatar/${user.id}?v=${counts.avatar_v}` : null;

  return (
    <div className="mx-auto min-h-dvh max-w-3xl pb-[calc(104px+env(safe-area-inset-bottom))] sm:pb-10">
      <header className="flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-6 sm:pt-6 sm:pb-8">
        <Link href="/"><Logo /></Link>
        <div className="hidden sm:block"><NavLinks isAdmin={user.is_admin} badges={badges} onStrava={!!user.strava_athlete_id} avatar={avatar} /></div>
      </header>
      <main className="px-4">{children}</main>
      <StayFresh version={APP_VERSION} />
      <div className="tab-bar bottom-blur sm:hidden" aria-hidden="true"><span /><span /><span /></div>
      <nav className="tab-bar fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md sm:hidden">
        <NavLinks isAdmin={user.is_admin} badges={badges} onStrava={!!user.strava_athlete_id} avatar={avatar} mobile />
      </nav>
    </div>
  );
}
