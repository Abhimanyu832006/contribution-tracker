"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleGrid from "@/components/dashboard/ModuleGrid";
import { useModuleTransition } from "@/components/dashboard/ModuleTransitionProvider";

/**
 * Thin dashboard-side adapter — all orchestration (orbit, expansion,
 * navigation, readiness) lives in ModuleTransitionProvider, which is
 * mounted higher up (in AppChrome) so it survives the actual page swap.
 * This component just owns the tile refs, reads geometry once on click,
 * and hands off to the provider.
 */
export default function ModuleTransitionController({ tiles, header, statStrip, bottomSection }) {
  const router = useRouter();
  const { beginTransition } = useModuleTransition();
  const tileElsRef = useRef([]);

  const registerRef = useCallback((i, el) => {
    tileElsRef.current[i] = el;
  }, []);

  const handleTileClick = useCallback(
    (e, tile, index) => {
      // Let modifier-clicks (new tab / window) and middle-click behave normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      e.preventDefault();
      router.prefetch(tile.href);

      const tileEntries = tileElsRef.current.map((el) => ({
        el,
        rect: el.getBoundingClientRect(),
      }));

      beginTransition({ tileEntries, selectedIndex: index, tile });
    },
    [router, beginTransition]
  );

  return (
    <div className="min-h-screen overflow-hidden">
      {header}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        {statStrip}
        <ModuleGrid tiles={tiles} registerRef={registerRef} onTileClick={handleTileClick} />
        {bottomSection}
      </div>
    </div>
  );
}
