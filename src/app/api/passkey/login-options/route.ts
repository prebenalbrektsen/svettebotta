import { loginOptions } from "@/lib/passkeys";

export async function POST() {
  return Response.json(await loginOptions());
}
