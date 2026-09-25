"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const MAX_LENGTH = 40;

/**
 * Wraps the header's avatar to make it clickable — opens a small modal to
 * edit the account's display name (shown everywhere github_username used
 * to be rendered raw). Self-contained: owns its own open state, save
 * request, and session refresh, so both AppHeader and FacultyHeader can
 * drop it in without wiring anything up themselves.
 */
export default function ProfileMenu({ user, size = "sm" }) {
  const { update } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.githubUsername || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setName(user?.githubUsername || "");
    setError("");
    setOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (name.trim().length > MAX_LENGTH) {
      setError(`Display name must be ${MAX_LENGTH} characters or fewer.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      await update({ githubUsername: data.effectiveName });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
        title="Edit profile"
      >
        <Avatar src={user?.avatarUrl} name={user?.githubUsername} size={size} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded bg-[var(--color-surface)] p-6 brutal-shadow-lg border border-[var(--color-border)] animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={user?.avatarUrl} name={user?.githubUsername} size="lg" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[var(--color-text-primary)]">
                    Edit Profile
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Change how your name appears across the app
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border border-[var(--color-border)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Display Name"
                  id="display-name"
                  name="display-name"
                  type="text"
                  autoComplete="off"
                  value={name}
                  maxLength={MAX_LENGTH}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={saving}
                />
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Leave blank to reset to your GitHub/Google name.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                    className="rounded px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)] transition-colors"
                  >
                    Cancel
                  </button>
                  <Button type="submit" loading={saving}>
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
