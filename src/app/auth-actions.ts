"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { admins, push } from "@/lib/push";
import { checkPassword, endSession, hashPassword, startSession } from "@/lib/auth";
import { one, query } from "@/lib/db";

export type FormState = { error?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await one<{ id: number; password_hash: string | null }>("select id, password_hash from users where lower(email) = $1", [email]);
  if (!user?.password_hash || !(await checkPassword(password, user.password_hash))) {
    return { error: "Feil e-post eller passord." };
  }
  await startSession(user.id);
  redirect("/");
}

/** First run only: the very first account becomes the admin. */
export async function setupAdmin(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email || password.length < 8) return { error: "Fyll inn navn, e-post og et passord på minst 8 tegn." };
  const created = await one<{ id: number }>(
    `insert into users (name, email, password_hash, is_admin)
     select $1, $2, $3, true where not exists (select 1 from users) returning id`,
    [name, email, await hashPassword(password)],
  );
  if (!created) return { error: "Appen er allerede satt opp. Logg inn i stedet." };
  await startSession(created.id);
  redirect("/admin");
}

export async function acceptInvite(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || password.length < 8) return { error: "Fyll inn e-post og et passord på minst 8 tegn." };
  const taken = await one("select 1 from users where lower(email) = $1 and invite_token is distinct from $2", [email, token]);
  if (taken) return { error: "Den e-posten er allerede i bruk." };
  const user = await one<{ id: number }>(
    "update users set email = $2, password_hash = $3, invite_token = null where invite_token = $1 returning id",
    [token, email, await hashPassword(password)],
  );
  if (!user) return { error: "Invitasjonen er brukt eller ugyldig. Be admin om en ny lenke." };
  await startSession(user.id);
  redirect("/velkommen");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/login");
}

export async function hasUsers(): Promise<boolean> {
  return (await query("select 1 from users limit 1")).length > 0;
}

/** Shared family link: anyone with it can ask to join; the admin approves them before they get in. */
export async function joinViaGroupLink(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const valid = await one("select 1 from settings where key = 'group_invite' and value = $1", [token]);
  if (!token || !valid) return { error: "Lenken er ikke lenger i bruk. Be kontrolløren om en ny." };
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email || password.length < 8) return { error: "Fyll inn navn, e-post og et passord på minst 8 tegn." };
  if (await one("select 1 from users where lower(email) = $1", [email])) return { error: "Den e-posten er allerede i bruk. Logg inn i stedet." };
  const colors = ["#e4572e", "#2e86ab", "#7a9e3e", "#a23b72", "#f18f01", "#3b1f2b", "#0f7173", "#c73e1d", "#6a4c93", "#1982c4"];
  const count = await one<{ n: number }>("select count(*)::int as n from users");
  const user = await one<{ id: number }>(
    "insert into users (name, email, password_hash, color, approved) values ($1, $2, $3, $4, false) returning id",
    [name, email, await hashPassword(password), colors[count!.n % colors.length]],
  );
  await startSession(user!.id);
  after(async () => push(await admins(), "admin", { title: "👋 Ny deltaker venter", body: `${name} vil bli med i Treningsutfordring`, url: "/admin?fane=deltakere" }));
  redirect("/venter");
}
