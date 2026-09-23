"use client";

import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";
import NavigationLoadingProvider from "@/components/NavigationLoadingProvider";

const ACCENTS = {
  "/contributions": "var(--color-contributions)",
  "/peer-verification": "var(--color-verification)",
  "/scores": "var(--color-reports)",
  "/settings": "var(--color-settings)",
  "/team": "var(--color-team)",
  "/log": "var(--color-contributions)",
};

function accentFor(pathname) {
  const match = Object.keys(ACCENTS).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  return match ? ACCENTS[match] : "var(--color-primary)";
}

/**
 * Wraps every (app) page. The bento home ("/dashboard") renders full-bleed
 * with no chrome; every other module gets a slim TopBar with a way back.
 */
export default function AppChrome({ user, projectName, activeProjectId, projects, children }) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";

  return (
    <NavigationLoadingProvider>
      {isHome ? (
        children
      ) : (
        <>
          <TopBar
            user={user}
            projectName={projectName}
            activeProjectId={activeProjectId}
            projects={projects}
            accent={accentFor(pathname)}
          />
          <main>
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">{children}</div>
          </main>
        </>
      )}
    </NavigationLoadingProvider>
  );
}
