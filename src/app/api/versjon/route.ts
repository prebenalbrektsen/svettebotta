import { APP_VERSION } from "@/lib/version";

/** Which build is live, so an app left open on a phone can tell it has been updated. */
export function GET() {
  return Response.json({ version: APP_VERSION }, { headers: { "cache-control": "no-store" } });
}
