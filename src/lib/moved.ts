import { osloDate } from "./time";

// Temporary: the app moved from svettebotta.vercel.app to treningsutfordring.vercel.app on
// 29 October 2026. Until December everyone gets a heads-up; delete this file and its uses after that.
export function movedNotice(): boolean {
  return process.env.APP_URL === "https://treningsutfordring.vercel.app" && osloDate() < "2026-12-01";
}
