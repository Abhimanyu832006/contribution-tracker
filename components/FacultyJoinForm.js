"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function FacultyJoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects/faculty-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join project.");
      }
      router.push(`/faculty/${data.project_id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card accent="var(--color-team)" className="max-w-md space-y-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-tight text-[var(--color-text-primary)]">
          Supervise a Project
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Enter the faculty invite code a project leader shared with you.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border border-[var(--color-border)] animate-scale-in">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          id="faculty-invite-code"
          name="invite_code"
          type="text"
          placeholder="e.g. A1B2C3D4"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" loading={loading} className="shrink-0">
          Join
        </Button>
      </form>
    </Card>
  );
}
