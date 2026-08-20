import { redirect } from "next/navigation";

/**
 * /log has moved to /contributions.
 * This redirect ensures old bookmarks and any shared links still work.
 */
export default function LogRedirect() {
  redirect("/contributions");
}
