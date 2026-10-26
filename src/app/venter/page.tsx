import { InstallPrompt } from "@/components/InstallPrompt";
import { redirect } from "next/navigation";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Logo } from "@/components/Logo";
import { currentUser } from "@/lib/auth";
import { logout } from "../auth-actions";

/** Waiting room for people who joined through the shared link, until the admin approves them. */
export default async function WaitingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.approved) redirect("/velkommen");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 pt-[12vh] pb-10">
      <Logo size="lg" />
      <div className="card mt-8 space-y-3 p-5">
        <h1 className="text-lg font-bold">Takk, {user.name.split(" ")[0]}!</h1>
        <p className="text-muted">Kontrolløren må godkjenne deg før du kommer inn. Denne siden går videre av seg selv når det er gjort – eller kom tilbake senere og logg inn som vanlig.</p>
        <form action={logout}><button className="text-sm font-semibold text-muted underline">Logg ut</button></form>
      </div>
      <div className="mt-4"><InstallPrompt /></div>
      <LiveRefresh what="godkjent" />
    </main>
  );
}
