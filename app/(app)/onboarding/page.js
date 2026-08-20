"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [projectName, setProjectName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project.");
      }
      const data = await res.json();
      // Update the session so projectId is available
      await update({ projectId: data.project_id, role: "leader" });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      setError("Invite code is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: inviteCode.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join project.");
      }
      const data = await res.json();
      await update({ projectId: data.project_id, role: "member" });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-5">
            <svg
              className="w-7 h-7 text-white"
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
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session?.user?.githubUsername || "there"}!
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Get started by creating a new project or joining an existing one.
          </p>
        </div>

        {/* Choice cards */}
        {!mode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
            <Card
              hover
              className="cursor-pointer text-center group"
              onClick={() => setMode("create")}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
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
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Create a Project
              </h3>
              <p className="text-xs text-gray-500">
                Start a new project and invite your team
              </p>
            </Card>

            <Card
              hover
              className="cursor-pointer text-center group"
              onClick={() => setMode("join")}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
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
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.054a4.5 4.5 0 00-6.364-6.364L6.26 6.464a4.5 4.5 0 001.242 7.244"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Join a Project
              </h3>
              <p className="text-xs text-gray-500">
                Enter an invite code from your team leader
              </p>
            </Card>
          </div>
        )}

        {/* Create form */}
        {mode === "create" && (
          <Card className="animate-scale-in">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Create a Project
            </h3>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-4">
                {error}
              </p>
            )}
            <Input
              label="Project Name"
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. CS301 Final Project"
            />
            <div className="flex items-center gap-3 mt-5">
              <Button onClick={handleCreate} loading={loading}>
                Create Project
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMode(null);
                  setError("");
                }}
              >
                Back
              </Button>
            </div>
          </Card>
        )}

        {/* Join form */}
        {mode === "join" && (
          <Card className="animate-scale-in">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Join a Project
            </h3>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-4">
                {error}
              </p>
            )}
            <Input
              label="Invite Code"
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter the code from your team leader"
            />
            <div className="flex items-center gap-3 mt-5">
              <Button onClick={handleJoin} loading={loading}>
                Join Project
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMode(null);
                  setError("");
                }}
              >
                Back
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-8 text-center animate-fade-in">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            Sign out of GitHub / Reconnect account
          </button>
        </div>
      </div>
    </div>
  );
}
