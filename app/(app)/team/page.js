import { redirect } from "next/navigation";

/**
 * /team has moved to /settings (Project Settings page now includes team management).
 * This redirect ensures old bookmarks and any shared links still work.
 */
export default function TeamRedirect() {
  redirect("/settings");
}
