import { currentUser } from "@/lib/auth";
import { vapidKeys } from "@/lib/push";

export async function GET() {
  if (!(await currentUser())) return new Response(null, { status: 401 });
  return Response.json({ publicKey: (await vapidKeys()).publicKey });
}
