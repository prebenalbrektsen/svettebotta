import { InstallPrompt } from "@/components/InstallPrompt";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { one } from "@/lib/db";
import { joinViaGroupLink } from "../../auth-actions";

/** The shared family link: ask to join, then wait for the Kontrollør's OK. */
export default async function GroupJoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await one("select 1 from settings where key = 'group_invite' and value = $1", [token]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 pt-[12vh] pb-10">
      <Logo size="lg" />
      <div className="mt-6"><InstallPrompt /></div>
      <div className="card mt-4 p-5">
        {valid ? (
          <>
            <h1 className="mb-1 text-lg font-bold">Bli med i Treningsutfordring</h1>
            <p className="mb-4 text-sm text-muted">Lag en konto, så slipper kontrolløren deg inn.</p>
            <AuthForm
              action={joinViaGroupLink}
              submit="Be om å bli med"
              hidden={{ token }}
              fields={[
                { name: "name", label: "Navn (det de andre ser)", autoComplete: "given-name" },
                { name: "email", label: "E-post", type: "email", autoComplete: "email" },
                { name: "password", label: "Passord (minst 8 tegn)", type: "password", autoComplete: "new-password" },
              ]}
            />
          </>
        ) : (
          <p>Denne lenken er ikke lenger i bruk. Be kontrolløren om en ny.</p>
        )}
      </div>
    </main>
  );
}
