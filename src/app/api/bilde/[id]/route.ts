import { currentUser } from "@/lib/auth";
import { one } from "@/lib/db";

// ?liten=1 gives the 200 px thumbnail used in lists (older photos without one get the full image).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) return new Response("Ikke innlogget", { status: 401 });
  const { id } = await params;
  const small = new URL(request.url).searchParams.has("liten");
  const row = await one<{ data: Buffer; small: boolean; proof_mime: string }>(
    `select coalesce(case when $2 then proof_thumb end, proof_image) as data, ($2 and proof_thumb is not null) as small, proof_mime
       from workouts where id = $1 and proof_image is not null`,
    [Number(id), small],
  );
  if (!row) return new Response("Finnes ikke", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "content-type": row.small ? "image/webp" : row.proof_mime, "cache-control": "private, max-age=86400" },
  });
}
