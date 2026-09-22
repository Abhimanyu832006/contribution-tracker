"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";

const NAV_ITEMS = [
  { index: "01", label: "Dashboard", href: "/dashboard" },
  { index: "02", label: "Contributions", href: "/contributions" },
  { index: "03", label: "Peer Verification", href: "/peer-verification" },
  { index: "04", label: "Reports", href: "/scores" },
  { index: "05", label: "Project Settings", href: "/settings" },
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
      <div className="lg:hidden fixed top-0 inset-x-0 z-20 flex items-center justify-between h-14 px-4 bg-[#f3f1ea] text-[#141311] border-b border-[#141311]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="label-mono shrink-0">CT</span>
          <span className="font-serif text-base truncate">
            {projectName || "Contribution Tracker"}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen((p) => !p)}
          className="p-2 text-[#141311]"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          className="lg:hidden fixed inset-0 z-30 bg-[#141311]/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#f3f1ea] text-[#141311] border-r border-[#141311] transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Project Switcher */}
        <div className="relative px-5 pt-6 pb-5 border-b border-[#141311]" ref={dropdownRef}>
          <p className="label-mono mb-3">CONTRIBUTION TRACKER</p>

          {/* Project Selector Trigger */}
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-full text-left group"
            title="Switch Project"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-serif text-2xl leading-none truncate">
                {projectName || "Select Project"}
              </span>
              <span className="shrink-0 mt-0.5 text-[#4a473f] group-hover:text-[#141311] transition-colors">
                {switching ? (
                  <span className="block w-3.5 h-3.5 border-2 border-[#141311] border-t-transparent animate-spin" />
                ) : (
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </span>
            </div>
            <p className="label-mono mt-1.5">
              {projects.length} PROJECT{projects.length === 1 ? "" : "S"} — SWITCH ↓
            </p>
          </button>

          {/* Project list (inline, ruled — not a floating card) */}
          {dropdownOpen && (
            <div className="mt-3 border-t border-[#141311]">
              {projects.map((p) => {
                const isActive = p.id === activeProjectId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchProject(p.id)}
                    className={`w-full flex items-center justify-between gap-2 px-1 py-2.5 border-b border-[rgba(20,19,17,0.14)] text-left transition-colors ${
                      isActive ? "bg-[#141311] text-[#f3f1ea] px-2" : "hover:bg-[#eae7dd]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className={`label-mono !text-[9px] ${isActive ? "!text-[#f3f1ea]/60" : ""}`}>
                        {p.role}
                      </p>
                    </div>
                    {isActive && (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                className="flex items-center gap-2 py-2.5 text-[#c23600] label-mono hover:underline"
              >
                + JOIN OR CREATE PROJECT
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-baseline gap-3 px-5 py-3 border-b border-[rgba(20,19,17,0.1)] text-sm transition-colors ${
                  isActive
                    ? "border-l-2 border-l-[#ff4b12] bg-[#faf9f5] font-medium"
                    : "border-l-2 border-l-transparent text-[#4a473f] hover:text-[#141311] hover:bg-[#faf9f5]/60"
                }`}
              >
                <span className="label-mono !text-[10px] shrink-0">{item.index}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-[#141311] p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={user?.avatarUrl}
              name={user?.githubUsername}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.githubUsername}
              </p>
              <p className="label-mono !text-[9px] mt-0.5">
                {user?.role === "leader" ? "TEAM LEADER" : "MEMBER"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="label-mono !text-[9px] shrink-0 hover:text-[#141311] hover:underline"
              title="Sign out"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
