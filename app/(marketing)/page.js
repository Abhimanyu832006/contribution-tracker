import { redirect } from "next/navigation";
import { getSession, getActiveMembership } from "@/lib/auth";
import LandingContent from "./LandingContent";

export const metadata = {
  title: "Contribution Tracker — Team Project Contributions Made Simple",
  description:
    "Log, verify, and visualize your team's project contributions. Built for student teams.",
};

export default async function LandingPage() {
  const session = await getSession();

  // If already signed in, redirect to dashboard or onboarding
  if (session?.user) {
    const membership = await getActiveMembership(session.user.dbId);
    if (membership) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return <LandingContent />;
}
