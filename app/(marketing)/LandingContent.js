"use client";

import { signIn } from "next-auth/react";

export default function LandingContent() {
  return (
    <main className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Contribution Tracker
            </span>
          </div>
          <button
            onClick={() => signIn("github")}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl mx-auto text-center py-24 animate-fade-in">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 px-4 py-1.5 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Built for student teams
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
            Track every
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {" "}
              contribution
            </span>
            <br />
            your team makes
          </h1>

          <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Log work, share progress, and give everyone on your project the
            credit they deserve — all in one clean, simple dashboard.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => signIn("github")}
              className="inline-flex items-center gap-3 rounded-xl bg-indigo-600 text-white px-8 py-3.5 text-base font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.98]"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Get Started with GitHub
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="border-t border-gray-200/60 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Log Contributions
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Quickly log what you worked on, how long it took, and categorize
                it — research, design, code, testing, or meetings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Team Dashboard
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                See who&apos;s doing what at a glance. Every team member&apos;s hours and
                activity, all in one real-time dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-violet-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.054a4.5 4.5 0 00-6.364-6.364L6.26 6.464a4.5 4.5 0 001.242 7.244"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Easy Invite Codes
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Create a project, share the invite code, and your whole team can
                join in seconds. No emails, no friction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-200/60 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Contribution Tracker
          </p>
          <p className="text-xs text-gray-400">
            Built for group assignments
          </p>
        </div>
      </footer>
    </main>
  );
}
