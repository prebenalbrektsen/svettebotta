import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { one } from "@/lib/db";
import { acceptInvite } from "../../auth-actions";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await one<{ name: string; email: string | null }>("select name, email from users where invite_token = $1", [token]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 pt-[12vh] pb-10">
      <Logo size="lg" />
      <div className="card mt-8 p-5">
        {user ? (
          <>
            <h1 className="mb-1 text-lg font-bold">Hei, {user.name}!</h1>
            <p className="mb-4 text-sm text-muted">Velg e-post og passord, så er du inne. Etterpå viser vi deg hvordan du kobler til klokka og melder deg på utfordringen.</p>
            <AuthForm
              action={acceptInvite}
              submit="Bli med"
              hidden={{ token }}
              fields={[
                { name: "email", label: "E-post", type: "email", autoComplete: "email", defaultValue: user.email ?? "" },
                { name: "password", label: "Passord (minst 8 tegn)", type: "password", autoComplete: "new-password" },
              ]}
            />
          </>
        ) : (
          <p>Denne invitasjonen er brukt eller finnes ikke. Be admin om en ny lenke.</p>
        )}
      </div>
    </main>
  );
}
