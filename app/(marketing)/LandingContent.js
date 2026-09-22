"use client";

import { signIn } from "next-auth/react";

const CONTRIBUTION_TYPES = [
  { n: "01", label: "Code", detail: "GitHub commits, synced automatically" },
  { n: "02", label: "Documentation", detail: "Guides, specs, API references" },
  { n: "03", label: "Research", detail: "Findings, analysis, requirements" },
  { n: "04", label: "UI/UX", detail: "Design work, prototypes, flows" },
  { n: "05", label: "Testing", detail: "QA passes, bug reports" },
  { n: "06", label: "Planning", detail: "Coordination, presentations, reports" },
];

export default function LandingContent() {
  return (
    <main className="min-h-screen bg-[#f3f1ea] text-[#141311] flex flex-col">
      {/* ── Nav — thin rule strip, no floating pill nav ─────────── */}
      <nav className="border-b border-[#141311] sticky top-0 z-50 bg-[#f3f1ea]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-serif text-xl">Contribution Tracker</span>
          <button
            onClick={() => signIn("github")}
            className="font-mono uppercase tracking-wider text-xs px-4 py-2.5 border border-[#141311] hover:bg-[#141311] hover:text-[#f3f1ea] transition-colors"
          >
            Sign in with GitHub
          </button>
        </div>
      </nav>

      {/* ── Masthead ──────────────────────────────────────────── */}
      <section className="border-b border-[#141311]">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
          <p className="label-mono mb-4">CONTRIBUTION TRACKER — ISSUE NO. 001</p>
          <h1 className="font-serif text-5xl sm:text-7xl leading-[0.95] max-w-3xl">
            Who actually did the work?
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[#4a473f] max-w-xl leading-relaxed">
            A record of every contribution a team makes — code and otherwise.
            GitHub commits are one kind of evidence. Documentation, research,
            design, and testing are others. Contribution Tracker records both,
            side by side, and lets the team verify each other&apos;s work.
          </p>
          <div className="mt-10 flex items-center gap-6">
            <button
              onClick={() => signIn("github")}
              className="font-mono uppercase tracking-wider text-sm px-6 py-3.5 bg-[#141311] text-[#f3f1ea] hover:bg-[#ff4b12] transition-colors"
            >
              Get Started with GitHub →
            </button>
          </div>
        </div>
      </section>

      {/* ── Core distinction — editorial two-column, not feature cards ── */}
      <section className="border-b border-[#141311]">
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <p className="label-mono mb-3">GITHUB EVIDENCE</p>
            <p className="font-serif text-3xl leading-tight">
              Commits sync automatically and verify themselves.
            </p>
            <p className="mt-4 text-sm text-[#4a473f] leading-relaxed">
              Link a repository once. Every commit by a team member becomes a
              contribution entry — author, message, SHA, and link — with no
              manual entry required.
            </p>
          </div>
          <div className="md:border-l border-[#141311] md:pl-16">
            <p className="label-mono mb-3">MANUAL EVIDENCE</p>
            <p className="font-serif text-3xl leading-tight">
              Everything else is recorded, then verified by peers.
            </p>
            <p className="mt-4 text-sm text-[#4a473f] leading-relaxed">
              Documentation, research, design, testing, planning — logged with
              a category, description, and time estimate. Teammates review and
              vote to approve or flag, so self-reported work isn&apos;t taken
              on faith.
            </p>
          </div>
        </div>
      </section>

      {/* ── Contribution types — numbered editorial list, not icon cards ── */}
      <section className="border-b border-[#141311]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="label-mono mb-8">WHAT COUNTS AS A CONTRIBUTION</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {CONTRIBUTION_TYPES.map((t) => (
              <div key={t.n} className="rule-t border-r border-transparent md:border-r-[rgba(20,19,17,0.14)] py-5 pr-6">
                <p className="label-mono">{t.n}</p>
                <p className="font-serif text-xl mt-2">{t.label}</p>
                <p className="text-xs text-[#4a473f] mt-1">{t.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — vertical rule timeline ──────────────── */}
      <section className="border-b border-[#141311]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="label-mono mb-8">HOW IT WORKS</p>
          <div className="space-y-0">
            {[
              ["Create or join a project", "Start a workspace and invite your team with a code — no email setup."],
              ["Link a GitHub repository", "Optional. Commits by team members sync in as verifiable contributions."],
              ["Log the rest manually", "Documentation, research, design, testing — whatever isn't a commit."],
              ["Peers verify the work", "Teammates approve or flag each entry. Nothing is self-verified."],
            ].map(([title, desc], i) => (
              <div key={title} className="flex gap-6 rule-t py-5">
                <span className="label-mono w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-[#4a473f] mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ───────────────────────────────────────── */}
      <section className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-6 py-16 w-full">
          <p className="font-serif text-3xl sm:text-4xl max-w-lg leading-tight">
            Every contribution, on the record.
          </p>
          <button
            onClick={() => signIn("github")}
            className="mt-8 font-mono uppercase tracking-wider text-sm px-6 py-3.5 border border-[#141311] hover:bg-[#141311] hover:text-[#f3f1ea] transition-colors"
          >
            Sign in with GitHub
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-[#141311]">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between label-mono">
          <span>© {new Date().getFullYear()} CONTRIBUTION TRACKER</span>
          <span>BUILT FOR PROJECT TEAMS</span>
        </div>
      </footer>
    </main>
  );
}
