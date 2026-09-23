"use client";

import { forwardRef } from "react";
import Link from "next/link";

/**
 * A single bento tile. Pure presentation + ref forwarding — all
 * transition math lives in ModuleTransitionController, which drives
 * this element's transform/opacity directly via the forwarded ref
 * (not through props/re-renders) once a transition starts.
 */
const ModuleTile = forwardRef(function ModuleTile({ tile, onClick }, ref) {
  return (
    <Link
      ref={ref}
      href={tile.href}
      onClick={onClick}
      className={`brutal-tile overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${tile.big}`}
      style={{ background: tile.accent }}
    >
      <div className="flex items-center justify-between">
        <svg
          className={`w-6 h-6 sm:w-7 sm:h-7 ${tile.textLight ? "text-white" : "text-black"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          {tile.icon}
        </svg>
        <svg
          className={`w-4 h-4 ${tile.textLight ? "text-white/60" : "text-black/40"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
      <div>
        {tile.stat !== null && (
          <p className={`stat-num text-3xl sm:text-4xl ${tile.textLight ? "text-white" : "text-black"}`}>
            {tile.stat}
          </p>
        )}
        <p className={`text-sm font-black uppercase tracking-tight mt-0.5 ${tile.textLight ? "text-white" : "text-black"}`}>
          {tile.label}
        </p>
        <p className={`text-xs mt-0.5 truncate ${tile.textLight ? "text-white/70" : "text-black/60"}`}>
          {tile.sub || tile.statLabel}
        </p>
      </div>
    </Link>
  );
});

export default ModuleTile;
