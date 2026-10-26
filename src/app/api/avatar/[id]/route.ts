import { currentUser } from "@/lib/auth";
import { one } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) return new Response("Ikke innlogget", { status: 401 });
  const { id } = await params;
  const row = await one<{ avatar: Buffer }>("select avatar from users where id = $1 and avatar is not null", [Number(id)]);
  if (!row) return new Response("Finnes ikke", { status: 404 });
  // The URL carries ?v=<updated time>, so a new picture gets a new URL and this can be cached hard.
  return new Response(new Uint8Array(row.avatar), { headers: { "content-type": "image/webp", "cache-control": "private, max-age=31536000, immutable" } });
}
