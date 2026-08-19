"use client";

import Sidebar from "@/components/Sidebar";

export default function AppShell({ children, user, projectName }) {
  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar user={user} projectName={projectName} />

      {/* Main content area — offset by sidebar width */}
      <main className="flex-1 ml-64">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
