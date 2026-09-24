"use client";

import { signOut } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Header for the bento home ("/dashboard"). No persistent sidebar —
 * just identity + sign out, since every module is reached by drilling
 * into a tile below.
 */
export default function HomeHeader({ projectName, repoOwner, repoName, user }) {
  return (
    <header className="relative border-b border-[var(--color-border)] overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-8 sm:pt-8 sm:pb-12">
        {/* Brand row — the actual product name, unambiguous and legible
            on its own line, decoupled from the stylized project-name
            headline below it (which used to double as the only "title"
            on the page and crowded the product name out entirely). */}
        <div className="flex items-center justify-between gap-4 animate-rise-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-8 h-8 shrink-0 rounded flex items-center justify-center border border-[var(--color-border)]"
              style={{ background: "var(--color-primary)", boxShadow: "var(--shadow-brutal-sm)" }}
            >
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            <p className="text-sm sm:text-base font-bold uppercase tracking-wide truncate text-[var(--color-text-primary)]">
              Contribution Tracker
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Avatar src={user?.avatarUrl} name={user?.githubUsername} size="md" />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 border border-transparent hover:border-[var(--color-border)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              title="Sign out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Project name — still the big stylized headline, now with room
            of its own instead of competing with the brand row above it. */}
        <div className="mt-6 sm:mt-8 animate-rise-in" style={{ animationDelay: "60ms" }}>
          <h1 className="hero-display text-4xl sm:text-5xl truncate text-[var(--color-text-primary)]">
            {projectName || "Your project"}
          </h1>
          {repoOwner && repoName ? (
            <a
              href={`https://github.com/${repoOwner}/${repoName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-sweep inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] mt-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {repoOwner}/{repoName}
            </a>
          ) : (
            <a href="/settings" className="link-sweep text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mt-3 inline-block transition-colors">
              No repository linked — connect one in Settings
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
