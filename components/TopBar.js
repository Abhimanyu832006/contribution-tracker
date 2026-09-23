"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Slim brutalist top bar used inside a module's focused view.
 * Replaces the persistent sidebar: a "back to home" control plus
 * project switcher and account menu, nothing else pinned on screen.
 */
export default function TopBar({
  user,
  projectName,
  activeProjectId,
  projects = [],
  accent = "var(--color-primary)",
}) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitchProject(projectId) {
    if (projectId === activeProjectId || switching) {
      setDropdownOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const res = await fetch("/api/projects/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        setDropdownOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to switch project:", err);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <header
      className="sticky top-0 z-30 border-b-2 border-[var(--color-border)] bg-[var(--color-bg)]"
      style={{ boxShadow: "0 4px 0 0 var(--color-border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 shrink-0 group"
          aria-label="Back to home"
        >
          <span
            className="w-9 h-9 rounded flex items-center justify-center border-2 border-[var(--color-border)] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ background: accent, boxShadow: "var(--shadow-brutal-sm)" }}
          >
            <svg className="w-4.5 h-4.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </span>
          <span className="hidden sm:inline text-sm font-black uppercase tracking-tight">
            Home
          </span>
        </Link>

        <div className="relative flex-1 max-w-xs" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 border-2 border-[var(--color-border)] bg-[var(--color-surface)] rounded text-left"
            title="Switch project"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Project
              </span>
              <span className="block text-sm font-bold truncate">
                {projectName || "Select project"}
              </span>
            </span>
            {switching ? (
              <span className="w-3.5 h-3.5 border-2 border-[var(--color-border)] border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <svg className={`w-4 h-4 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 border-2 border-[var(--color-border)] bg-[var(--color-surface)] rounded p-1.5" style={{ boxShadow: "var(--shadow-brutal)" }}>
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Your projects ({projects.length})
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {projects.map((p) => {
                  const isActive = p.id === activeProjectId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSwitchProject(p.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded text-xs font-bold text-left border-2 ${
                        isActive
                          ? "border-[var(--color-border)] bg-[var(--color-primary)] text-white"
                          : "border-transparent hover:border-[var(--color-border)]"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      {isActive && (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="border-t-2 border-[var(--color-border)] mt-1.5 pt-1.5">
                <Link
                  href="/onboarding"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                >
                  + Join or create project
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Avatar src={user?.avatarUrl} name={user?.githubUsername} size="sm" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 border-2 border-transparent hover:border-[var(--color-border)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
