import { redirect } from "next/navigation";

// The full feed now lives under the workouts tab («Alle»).
export default function FeedPage() {
  redirect("/logg?vis=alle");
}
