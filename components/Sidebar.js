"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";

const NAV_ITEMS = [
  { index: "01", label: "Dashboard", href: "/dashboard", color: "#1a3fd6" },
  { index: "02", label: "Contributions", href: "/contributions", color: "#ff4713" },
  { index: "03", label: "Verification", href: "/peer-verification", color: "#16a34a" },
  { index: "04", label: "Reports", href: "/scores", color: "#eab308" },
  { index: "05", label: "Settings", href: "/settings", color: "#928c78" },
];

export default function Sidebar({
  user,
  projectName,
  activeProjectId,
  projects = [],
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
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
        // Refresh server components to re-run queries with the new project
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to switch project:", err);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <>
      {/* Mobile top strip */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-20 flex items-center justify-between h-16 px-4 bg-[#0e0d0b] text-[#f4f2ec]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 bg-[#ff4713] shrink-0" />
          <span className="font-[family-name:var(--font-poster)] text-lg truncate">
            {projectName || "CONTRIBUTION TRACKER"}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen((p) => !p)}
          className="p-2 text-[#f4f2ec]"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-[#0e0d0b]/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col bg-[#0e0d0b] text-[#f4f2ec] transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Project Switcher */}
        <div className="relative px-6 pt-7 pb-6" ref={dropdownRef}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 bg-[#ff4713]" />
            <span className="w-2.5 h-2.5 bg-[#1a3fd6]" />
            <p className="label-mono !text-[#928c78]">CONTRIBUTION TRACKER</p>
          </div>

          {/* Project Selector Trigger */}
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-full text-left group"
            title="Switch Project"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-[family-name:var(--font-poster)] text-[2.1rem] leading-[0.92] tracking-tight break-words">
                {projectName || "SELECT PROJECT"}
              </span>
              <span className="shrink-0 mt-1.5 text-[#928c78] group-hover:text-[#f4f2ec] transition-colors">
                {switching ? (
                  <span className="block w-4 h-4 border-2 border-[#f4f2ec] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </span>
            </div>
            <p className="label-mono !text-[#928c78] mt-2">
              {projects.length} PROJECT{projects.length === 1 ? "" : "S"} — SWITCH ↓
            </p>
          </button>

          {/* Project list */}
          {dropdownOpen && (
            <div className="mt-4 -mx-1 animate-scale-in">
              {projects.map((p) => {
                const isActive = p.id === activeProjectId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchProject(p.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${
                      isActive ? "bg-[#ff4713] text-[#0e0d0b]" : "text-[#c9c5b8] hover:bg-white/10"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className={`font-mono text-[9px] uppercase tracking-wider ${isActive ? "text-[#0e0d0b]/70" : "text-[#928c78]"}`}>
                        {p.role}
                      </p>
                    </div>
                    {isActive && (
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
              <Link
                href="/onboarding"
                onClick={() => {
                  setDropdownOpen(false);
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-[#1a3fd6] font-mono text-xs uppercase tracking-wider hover:underline"
              >
                + Join or create project
              </Link>
            </div>
          )}
        </div>

        {/* Navigation — each item carries its own color signal */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3.5 px-3 py-3.5 my-0.5 rounded-[3px] transition-all duration-150 group ${
                  isActive ? "text-[#0e0d0b]" : "text-[#c9c5b8] hover:bg-white/[0.06] hover:text-[#f4f2ec]"
                }`}
                style={isActive ? { backgroundColor: item.color } : undefined}
              >
                <span
                  className={`font-mono text-[11px] tracking-wider w-5 shrink-0 ${isActive ? "opacity-70" : "text-[#928c78]"}`}
                >
                  {item.index}
                </span>
                <span className="text-[15px] font-semibold tracking-tight">{item.label}</span>
                {!isActive && (
                  <span
                    className="ml-auto w-2 h-2 rounded-full shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={user?.avatarUrl}
              name={user?.githubUsername}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-[#f4f2ec]">
                {user?.githubUsername}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#928c78] mt-0.5">
                {user?.role === "leader" ? "Team Leader" : "Member"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="font-mono text-[9px] uppercase tracking-wider text-[#928c78] shrink-0 hover:text-[#f4f2ec] hover:underline"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
