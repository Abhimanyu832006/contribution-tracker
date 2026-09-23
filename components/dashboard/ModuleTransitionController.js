"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleGrid from "@/components/dashboard/ModuleGrid";
import { useNavigationLoading } from "@/components/NavigationLoadingProvider";

/**
 * Thin dashboard-side adapter — all orchestration (the loading overlay,
 * navigation, readiness) lives in NavigationLoadingProvider, which is
 * mounted higher up (in AppChrome) so it survives the actual page swap
 * and covers every other in-app navigation too. Dashboard tiles call
 * beginTransition directly (and call preventDefault themselves) so they
 * can pass their own icon/accent/label for a richer look than the
 * generic version every other link gets automatically.
 */
export default function ModuleTransitionController({ tiles, header, statStrip, bottomSection }) {
  const router = useRouter();
  const { beginTransition } = useNavigationLoading();

  const handleTileClick = useCallback(
    (e, tile) => {
      // Let modifier-clicks (new tab / window) and middle-click behave normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      e.preventDefault();
      router.prefetch(tile.href);
      beginTransition({
        href: tile.href,
        label: tile.label,
        icon: tile.icon,
        accent: tile.accent,
        textLight: tile.textLight,
      });
    },
    [router, beginTransition],
  );

  return (
    <div className="min-h-screen overflow-hidden">
      {header}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        {statStrip}
        <ModuleGrid tiles={tiles} onTileClick={handleTileClick} />
        {bottomSection}
      </div>
    </div>
  );
}
