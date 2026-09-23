"use client";

import ModuleTile from "./ModuleTile";

/**
 * Renders the bento grid and wires each tile's DOM node back to the
 * controller via registerRef — that's how the controller gets a real
 * element to measure (getBoundingClientRect) and animate imperatively.
 */
export default function ModuleGrid({ tiles, registerRef, onTileClick }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[140px] sm:auto-rows-[160px] gap-3 sm:gap-4 stagger-children">
      {tiles.map((tile, i) => (
        <ModuleTile
          key={tile.href}
          ref={(el) => registerRef(i, el)}
          tile={tile}
          onClick={(e) => onTileClick(e, tile, i)}
        />
      ))}
    </div>
  );
}
