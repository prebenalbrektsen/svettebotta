import Link from "next/link";
import { after } from "next/server";
import { Logo } from "@/components/Logo";
import { MenuCloser } from "@/components/MenuCloser";
import { NavLinks } from "@/components/NavLinks";
import { requireUser } from "@/lib/auth";
import { announceWeekSummary } from "@/lib/announce";
import { syncStale } from "@/lib/autosync";
import { one } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Keep everyone's Strava workouts fresh without anybody pressing a button.
  after(async () => {
    await syncStale();
    await announceWeekSummary();
  });
  const pendingUsers = user.is_admin ? (await one<{ n: number }>("select count(*)::int as n from users where not approved"))!.n : 0;
  const unread = await one<{ n: number }>(
    "select count(*)::int as n from messages where created_at > $1 and (user_id is null or user_id <> $2)",
    [(await one<{ chat_seen_at: Date }>("select chat_seen_at from users where id = $1", [user.id]))!.chat_seen_at, user.id],
  );
  return (
    <div className="mx-auto min-h-dvh max-w-3xl pb-[calc(96px+env(safe-area-inset-bottom))] sm:pb-10">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/"><Logo /></Link>
        <div className="hidden sm:block"><NavLinks isAdmin={user.is_admin} unread={unread!.n} onStrava={!!user.strava_athlete_id} adminBadge={pendingUsers} /></div>
      </header>
      <main className="px-4">{children}</main>
      <MenuCloser />
      <nav className="tab-bar fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <NavLinks isAdmin={user.is_admin} unread={unread!.n} onStrava={!!user.strava_athlete_id} adminBadge={pendingUsers} mobile />
      </nav>
    </div>
  );
}
