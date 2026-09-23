"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleGrid from "@/components/dashboard/ModuleGrid";
import { useModuleTransition } from "@/components/dashboard/ModuleTransitionProvider";

/**
 * Thin dashboard-side adapter — all orchestration (the loading overlay,
 * navigation, readiness) lives in ModuleTransitionProvider, which is
 * mounted higher up (in AppChrome) so it survives the actual page swap.
 * No tile geometry is needed here anymore (the loading-screen model
 * doesn't do shared-element positioning), so this is just a click
 * handler and a prefetch hint.
 */
export default function ModuleTransitionController({ tiles, header, statStrip, bottomSection }) {
  const router = useRouter();
  const { beginTransition } = useModuleTransition();

  const handleTileClick = useCallback(
    (e, tile) => {
      // Let modifier-clicks (new tab / window) and middle-click behave normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      e.preventDefault();
      router.prefetch(tile.href);
      beginTransition({ tile });
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
