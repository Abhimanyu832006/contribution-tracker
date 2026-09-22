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
    <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec] px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-wider text-[#55503f] mb-2">Getting started</p>
          <h1 className="font-[family-name:var(--font-poster)] text-5xl leading-[0.85] tracking-tight">
            WELCOME, {(session?.user?.githubUsername || "THERE").toUpperCase()}
          </h1>
          <p className="text-sm text-[#55503f] mt-4">
            Create a new project or join an existing one to begin.
          </p>
        </div>

        {/* Choice cards */}
        {!mode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              hover
              accent="signal"
              className="cursor-pointer"
              onClick={() => setMode("create")}
            >
              <p className="stat-num text-3xl text-[#1a3fd6]">01</p>
              <p className="text-base font-semibold mt-3">
                Create a Project
              </p>
              <p className="text-xs text-[#55503f] mt-1">
                Start a new project and invite your team
              </p>
            </Card>

            <Card
              hover
              accent="work"
              className="cursor-pointer"
              onClick={() => setMode("join")}
            >
              <p className="stat-num text-3xl text-[#ff4713]">02</p>
              <p className="text-base font-semibold mt-3">
                Join a Project
              </p>
              <p className="text-xs text-[#55503f] mt-1">
                Enter an invite code from your team leader
              </p>
            </Card>
          </div>
        )}

        {/* Create form */}
        {mode === "create" && (
          <Card accent="signal">
            <p className="font-mono text-xs uppercase tracking-wider text-[#55503f] mb-4">Create a project</p>
            {error && (
              <p className="text-sm font-medium text-[#f4f2ec] bg-[#e11d2e] rounded-[3px] px-4 py-2.5 mb-4">
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
          <Card accent="work">
            <p className="font-mono text-xs uppercase tracking-wider text-[#55503f] mb-4">Join a project</p>
            {error && (
              <p className="text-sm font-medium text-[#f4f2ec] bg-[#e11d2e] rounded-[3px] px-4 py-2.5 mb-4">
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

        <div className="mt-8 text-center">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="font-mono text-xs uppercase tracking-wider text-[#928c78] hover:text-[#0e0d0b] hover:underline"
          >
            Sign out / reconnect account
          </button>
        </div>
      </div>
    </div>
  );
}
