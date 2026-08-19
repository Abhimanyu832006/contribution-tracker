"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Log Contribution",
    href: "/log",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    label: "Team",
    href: "/team",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#0f172a] text-white">
      {/* Brand & Project Switcher */}
      <div className="relative px-4 py-5 border-b border-white/10" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Contribution Tracker
            </span>
          </div>
        </div>

        {/* Project Selector Trigger Button */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-left group"
          title="Switch Project"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium">Active Project</p>
            <p className="text-sm font-semibold text-white truncate mt-0.5">
              {projectName || "Select Project"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-slate-400 group-hover:text-white transition-colors">
            {switching ? (
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
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
          </div>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute left-4 right-4 top-[calc(100%-8px)] z-50 rounded-xl bg-[#1e293b] border border-slate-700/80 shadow-2xl p-1.5 animate-scale-in">
            <div className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Your Projects ({projects.length})
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 my-1">
              {projects.map((p) => {
                const isActive = p.id === activeProjectId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchProject(p.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className={`text-[10px] capitalize ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                        {p.role}
                      </p>
                    </div>
                    {isActive && (
                      <svg className="w-4 h-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-700/80 pt-1.5 mt-1">
              <Link
                href="/onboarding"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Join or Create Project
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`transition-colors duration-200 ${
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
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
            <p className="text-sm font-medium text-white truncate">
              {user?.githubUsername}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user?.role === "leader" ? "Team Leader" : "Member"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
