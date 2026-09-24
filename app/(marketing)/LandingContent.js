"use client";

import { signIn } from "next-auth/react";

const FEATURES = [
  {
    accent: "var(--color-team)",
    title: "Log Every Contribution",
    body: "Not just code — research, design, testing, and meetings all count. Categorize and track hours for everything your team does.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    ),
  },
  {
    accent: "var(--color-contributions)",
    title: "Automatic GitHub Sync",
    body: "Link a repository and every commit by a team member becomes a contribution entry automatically — no manual entry needed.",
    icon: (
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    ),
    fill: true,
  },
  {
    accent: "var(--color-verification)",
    title: "Peer Verification",
    body: "Teammates review and vote to approve or flag each entry, so self-reported work is never just taken on faith.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    ),
  },
];

export default function LandingContent() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="w-full border-b border-[var(--color-border)] bg-[var(--color-bg)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded flex items-center justify-center border border-[var(--color-border)] brutal-shadow-sm" style={{ background: "var(--color-primary)" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-lg font-black uppercase tracking-tight text-[var(--color-text-primary)]">
              Contribution Tracker
            </span>
          </div>
          <button
            onClick={() => signIn("github")}
            className="brutal-btn inline-flex items-center gap-2 rounded bg-[#111111] text-white px-5 py-2.5 text-sm font-bold"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center py-20 sm:py-28 animate-fade-in">
          <div className="inline-flex items-center gap-2 border border-[var(--color-border)] bg-[var(--color-reports)] text-black px-4 py-1.5 text-xs font-black uppercase tracking-wider mb-8 rounded brutal-shadow-sm">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            Built for student teams
          </div>

          <h1 className="text-5xl sm:text-7xl font-black text-[var(--color-text-primary)] leading-[1.02] tracking-tight">
            Track every
            <br />
            <span
              className="inline-block px-3 -rotate-1 mt-2"
              style={{ background: "var(--color-contributions)", color: "#fff" }}
            >
              contribution
            </span>
            <br />
            your team makes
          </h1>

          <p className="mt-8 text-lg font-medium text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
            Log work, share progress, and give everyone on your project the
            credit they deserve — all in one clean, brutally honest dashboard.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => signIn("github")}
              className="brutal-btn inline-flex items-center gap-3 rounded bg-[var(--color-primary)] text-white px-8 py-3.5 text-base font-black uppercase tracking-tight"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Get started with GitHub
            </button>
          </div>
        </div>
      </section>

      {/* ── Features (bento-style) ─────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="label-mono text-center mb-2">What you get</p>
          <h2 className="text-3xl sm:text-4xl font-black text-center tracking-tight mb-12">
            Three tools. One source of truth.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {FEATURES.map((f) => (
              <div key={f.title} className="brutal-tile p-6 flex flex-col gap-4">
                <div
                  className="w-12 h-12 rounded flex items-center justify-center border border-[var(--color-border)]"
                  style={{ background: f.accent }}
                >
                  <svg
                    className={`w-6 h-6 ${f.fill ? "text-white" : "text-black"}`}
                    fill={f.fill ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    {f.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-black tracking-tight text-[var(--color-text-primary)]">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-xs font-bold text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Contribution Tracker
          </p>
          <p className="text-xs font-bold text-[var(--color-text-muted)]">
            Built for group assignments
          </p>
        </div>
      </footer>
    </main>
  );
}
