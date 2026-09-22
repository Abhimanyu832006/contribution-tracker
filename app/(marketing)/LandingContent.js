"use client";

import { signIn } from "next-auth/react";

const TYPES = [
  { label: "Code", color: "#1a3fd6" },
  { label: "Docs", color: "#ff4713" },
  { label: "Research", color: "#ff4713" },
  { label: "UI/UX", color: "#ff4713" },
  { label: "Testing", color: "#ff4713" },
  { label: "Planning", color: "#ff4713" },
];

export default function LandingContent() {
  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#0e0d0b] flex flex-col">
      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="border-b-2 border-[#0e0d0b] sticky top-0 z-50 bg-[#f4f2ec]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#1a3fd6]" />
            <span className="w-3 h-3 bg-[#ff4713] -ml-1" />
            <span className="font-[family-name:var(--font-poster)] text-lg ml-2">
              CONTRIBUTION TRACKER
            </span>
          </div>
          <button
            onClick={() => signIn("github")}
            className="font-semibold text-sm px-5 py-2.5 bg-[#0e0d0b] text-[#f4f2ec] rounded-[3px] hover:bg-[#ff4713] transition-colors"
          >
            Sign in with GitHub
          </button>
        </div>
      </nav>

      {/* ── Hero — huge poster type, overlapping color blocks ───── */}
      <section className="relative overflow-hidden border-b-2 border-[#0e0d0b]">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 relative">
          {/* Floating color blocks — layered behind the type */}
          <div className="absolute top-8 right-4 sm:right-12 w-24 h-24 sm:w-40 sm:h-40 bg-[#1a3fd6] rounded-[4px] rotate-6 opacity-90 hidden sm:block" />
          <div className="absolute top-24 right-24 sm:right-52 w-16 h-16 sm:w-24 sm:h-24 bg-[#eab308] rounded-full opacity-90 hidden sm:block" />

          <p className="font-mono text-xs uppercase tracking-wider text-[#55503f] mb-4">
            Two sources. One record.
          </p>
          <h1 className="font-[family-name:var(--font-poster)] text-6xl sm:text-8xl leading-[0.82] tracking-tight max-w-4xl">
            WHO DID
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">THE WORK</span>
              <span className="absolute inset-x-0 bottom-1 sm:bottom-3 h-4 sm:h-7 bg-[#ff4713] -z-0" />
            </span>
            ?
          </h1>
          <p className="mt-8 text-lg text-[#3a362a] max-w-xl leading-relaxed">
            GitHub commits are one kind of evidence. Documentation, research,
            design, and testing are others. Contribution Tracker records both
            — and lets the team verify each other&apos;s work.
          </p>
          <button
            onClick={() => signIn("github")}
            className="mt-9 inline-flex items-center gap-2 font-semibold text-base px-7 py-4 bg-[#0e0d0b] text-[#f4f2ec] rounded-[3px] hover:bg-[#ff4713] transition-colors shadow-[4px_4px_0_0_rgba(14,13,11,0.3)]"
          >
            Get started with GitHub →
          </button>
        </div>
      </section>

      {/* ── Signal vs Work — two solid color panels, side by side ── */}
      <section className="border-b-2 border-[#0e0d0b] grid grid-cols-1 md:grid-cols-2">
        <div className="p-10 sm:p-14 bg-[#1a3fd6] text-[#f4f2ec] border-b-2 md:border-b-0 md:border-r-2 border-[#0e0d0b]">
          <p className="font-mono text-xs uppercase tracking-wider opacity-70 mb-3">Signal</p>
          <p className="font-[family-name:var(--font-poster)] text-4xl sm:text-5xl leading-[0.9] mb-5">
            GITHUB
          </p>
          <p className="text-base leading-relaxed opacity-90 max-w-sm">
            Link a repository once. Every commit by a team member becomes a
            contribution — author, message, SHA, and link — synced
            automatically, no manual entry.
          </p>
        </div>
        <div className="p-10 sm:p-14 bg-[#ff4713] text-[#0e0d0b]">
          <p className="font-mono text-xs uppercase tracking-wider opacity-60 mb-3">Work</p>
          <p className="font-[family-name:var(--font-poster)] text-4xl sm:text-5xl leading-[0.9] mb-5">
            MANUAL
          </p>
          <p className="text-base leading-relaxed opacity-90 max-w-sm">
            Documentation, research, design, testing, planning — logged with
            a category, description, and time. Peers review and verify it,
            so self-reported work isn&apos;t taken on faith.
          </p>
        </div>
      </section>

      {/* ── What counts — dense chip cloud, not a feature grid ──── */}
      <section className="border-b-2 border-[#0e0d0b] py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs uppercase tracking-wider text-[#55503f] mb-6">
            What counts as a contribution
          </p>
          <div className="flex flex-wrap gap-3">
            {TYPES.map((t) => (
              <span
                key={t.label}
                className="font-[family-name:var(--font-poster)] text-xl sm:text-2xl px-5 py-2.5 rounded-[3px] border-2 border-[#0e0d0b]"
                style={{ backgroundColor: t.color, color: t.color === "#eab308" ? "#0e0d0b" : "#f4f2ec" }}
              >
                {t.label}
              </span>
            ))}
            <span className="font-[family-name:var(--font-poster)] text-xl sm:text-2xl px-5 py-2.5 rounded-[3px] border-2 border-dashed border-[#928c78] text-[#928c78]">
              + more
            </span>
          </div>
        </div>
      </section>

      {/* ── How it works — numbered, poster-scale numerals ──────── */}
      <section className="border-b-2 border-[#0e0d0b] py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs uppercase tracking-wider text-[#55503f] mb-8">
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              ["01", "Create or join", "Start a workspace, invite your team with a code."],
              ["02", "Link GitHub", "Optional — commits sync in as verifiable entries."],
              ["03", "Log the rest", "Documentation, research, design — whatever isn't a commit."],
              ["04", "Peers verify", "Teammates approve or flag. Nothing self-verifies."],
            ].map(([n, title, desc]) => (
              <div key={n}>
                <span className="stat-num text-5xl text-[#e8e5db]" style={{ WebkitTextStroke: "2px #0e0d0b" }}>
                  {n}
                </span>
                <p className="text-base font-semibold mt-2">{title}</p>
                <p className="text-sm text-[#55503f] mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA — a full color block ────────────────────── */}
      <section className="bg-[#0e0d0b] text-[#f4f2ec] flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <p className="font-[family-name:var(--font-poster)] text-4xl sm:text-6xl leading-[0.9] max-w-xl">
            EVERY CONTRIBUTION.
            <br />
            ON THE RECORD.
          </p>
          <button
            onClick={() => signIn("github")}
            className="shrink-0 font-semibold text-base px-7 py-4 bg-[#ff4713] text-[#0e0d0b] rounded-[3px] hover:bg-[#f4f2ec] transition-colors"
          >
            Sign in with GitHub
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-[#0e0d0b] text-[#928c78] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between font-mono text-xs uppercase tracking-wider">
          <span>© {new Date().getFullYear()} Contribution Tracker</span>
          <span>Built for project teams</span>
        </div>
      </footer>
    </main>
  );
}
