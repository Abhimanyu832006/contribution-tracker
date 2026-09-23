"use client";

import { useSyncExternalStore } from "react";

const THEME_CHANGE_EVENT = "theme-toggle-change";

/**
 * useSyncExternalStore (not useState+useEffect) is what avoids both a
 * hydration mismatch and a post-mount flash here: getServerSnapshot
 * returns null so SSR and the client's first paint agree, then React
 * re-reads getSnapshot right after hydration with no extra render step
 * of our own to trigger. Manual toggles dispatch a plain window event
 * so the store's only subscription also catches attribute changes we
 * make ourselves, not just OS-level prefers-color-scheme flips.
 */
function subscribe(callback) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    mq.removeEventListener("change", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot() {
  return null;
}

/**
 * Manual light/dark override, on top of the automatic OS-driven default.
 * Reads/writes the same `data-theme` attribute + localStorage key that
 * app/layout.js's pre-hydration script checks, so a saved choice is
 * applied before first paint (no flash) and persists across visits.
 */
export default function ThemeToggle({ className = "" }) {
  const resolved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = resolved === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage unavailable (private mode, etc.) — the choice just
      // won't persist across reloads, which is an acceptable fallback.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  const isDark = resolved === "dark";

  return (
    <button
      onClick={toggle}
      className={`p-2 border-2 border-transparent hover:border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] ${className}`}
      title={resolved === null ? "Toggle theme" : isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle light/dark theme"
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364 6.364l-1.06-1.06M6.697 6.697l-1.06-1.06m12.727 0l-1.06 1.06M6.697 17.303l-1.06 1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}
