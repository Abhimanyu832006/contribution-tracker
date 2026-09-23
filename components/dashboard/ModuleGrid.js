"use client";

import ModuleTile from "./ModuleTile";

/** Renders the bento grid. Each tile just needs a click handler now —
 * no ref/geometry plumbing, since the loading-overlay transition model
 * doesn't do shared-element positioning. */
export default function ModuleGrid({ tiles, onTileClick }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[140px] sm:auto-rows-[160px] gap-3 sm:gap-4 stagger-children">
      {tiles.map((tile) => (
        <ModuleTile key={tile.href} tile={tile} onClick={(e) => onTileClick(e, tile)} />
      ))}
    </div>
  );
}
