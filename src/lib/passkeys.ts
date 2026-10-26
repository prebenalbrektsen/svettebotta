import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { headers } from "next/headers";
import { newToken } from "./auth";
import { one, query } from "./db";

// Passkeys: log in with Face ID / Touch ID / fingerprint instead of typing a password. Same idea
// as site-cms, but the one-time challenge lives in the database, so no extra secret is needed.

/** The site the passkey is bound to: the live address, or localhost while developing. */
async function relyingParty(): Promise<{ rpID: string; origin: string }> {
  const live = new URL(process.env.APP_URL ?? "http://localhost:3100");
  const host = (await headers()).get("host") ?? live.host;
  const hostname = host.split(":")[0];
  if (hostname === "localhost") return { rpID: "localhost", origin: `http://${host}` };
  return { rpID: live.hostname, origin: live.origin };
}

async function saveChallenge(purpose: string, challenge: string, userId: number | null): Promise<string> {
  const token = newToken();
  await query("delete from webauthn_challenges where expires_at < now()");
  await query("insert into webauthn_challenges (token, user_id, purpose, challenge, expires_at) values ($1, $2, $3, $4, now() + interval '5 minutes')", [
    token, userId, purpose, challenge,
  ]);
  return token;
}

async function takeChallenge(token: unknown, purpose: string): Promise<{ user_id: number | null; challenge: string } | null> {
  if (typeof token !== "string") return null;
  return one("delete from webauthn_challenges where token = $1 and purpose = $2 and expires_at > now() returning user_id, challenge", [token, purpose]);
}

export async function registrationOptions(user: { id: number; name: string; email: string | null }) {
  const { rpID } = await relyingParty();
  const existing = await query<{ credential_id: string }>("select credential_id from passkeys where user_id = $1", [user.id]);
  const options = await generateRegistrationOptions({
    rpName: "Svettebøtta",
    rpID,
    userID: new TextEncoder().encode(String(user.id)),
    userName: user.email ?? user.name,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({ id: p.credential_id })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  return { options, token: await saveChallenge("register", options.challenge, user.id) };
}

export async function register(userId: number, token: unknown, response: RegistrationResponseJSON, name: string): Promise<boolean> {
  const ticket = await takeChallenge(token, "register");
  if (!ticket || ticket.user_id !== userId) return false;
  const { rpID, origin } = await relyingParty();
  const result = await verifyRegistrationResponse({ response, expectedChallenge: ticket.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true });
  if (!result.verified || !result.registrationInfo) return false;
  const { credential } = result.registrationInfo;
  await query(
    "insert into passkeys (user_id, credential_id, public_key, counter, transports, name) values ($1, $2, $3, $4, $5, $6) on conflict (credential_id) do nothing",
    [userId, credential.id, Buffer.from(credential.publicKey).toString("base64url"), credential.counter, response.response?.transports ?? [], name.trim().slice(0, 60) || "Passkey"],
  );
  return true;
}

export async function loginOptions() {
  const { rpID } = await relyingParty();
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
  return { options, token: await saveChallenge("login", options.challenge, null) };
}

/** The user a passkey belongs to, once the person unlocked it on their device. */
export async function verifyLogin(token: unknown, response: AuthenticationResponseJSON): Promise<number | null> {
  const ticket = await takeChallenge(token, "login");
  if (!ticket) return null;
  const stored = await one<{ id: number; user_id: number; credential_id: string; public_key: string; counter: string; transports: string[] }>(
    "select * from passkeys where credential_id = $1",
    [response?.id],
  );
  if (!stored) return null;
  const { rpID, origin } = await relyingParty();
  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge: ticket.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: stored.credential_id,
      publicKey: new Uint8Array(Buffer.from(stored.public_key, "base64url")),
      counter: Number(stored.counter),
      transports: stored.transports as AuthenticatorTransport[],
    },
  });
  if (!result.verified) return null;
  await query("update passkeys set counter = $2, last_used_at = now() where id = $1", [stored.id, result.authenticationInfo.newCounter]);
  return stored.user_id;
}
