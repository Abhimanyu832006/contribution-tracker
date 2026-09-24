"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";
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
 * Wraps every (app) page. AppHeader is the one global header, mounted
 * here unconditionally so the dashboard and every module share the same
 * navigation chrome — only the content below it differs: the dashboard
 * renders full-bleed (it manages its own width/padding), every other
 * module gets the standard centered, padded content column.
 */
export default function AppChrome({ user, projectName, activeProjectId, projects, children }) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";

  return (
    <NavigationLoadingProvider>
      <AppHeader
        user={user}
        projectName={projectName}
        activeProjectId={activeProjectId}
        projects={projects}
        accent={accentFor(pathname)}
      />
      {isHome ? (
        children
      ) : (
        <main>
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">{children}</div>
        </main>
      )}
    </NavigationLoadingProvider>
  );
}
