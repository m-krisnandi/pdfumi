import { redirect } from "next/navigation";

/**
 * Bare `/` is normally redirected by src/proxy.ts (Accept-Language + geo).
 * This is only a last-resort fallback if the proxy did not run.
 */
export default function RootPage() {
  redirect("/en");
}
