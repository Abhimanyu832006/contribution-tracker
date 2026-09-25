"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const MAX_LENGTH = 40;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Wraps the header's avatar to make it clickable — opens a small modal to
 * edit the account's display name and profile photo (both shown
 * everywhere github_username/avatar_url used to be rendered raw).
 * Self-contained: owns its own open state, save request, and session
 * refresh, so both AppHeader and FacultyHeader can drop it in without
 * wiring anything up themselves.
 */
export default function ProfileMenu({ user, size = "sm" }) {
  const { update } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.githubUsername || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function openModal() {
    setName(user?.githubUsername || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setError("");
    setOpen(true);
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) {
      setError("Image exceeds the 5 MB limit.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
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
      let avatarUrl;
      if (avatarFile) {
        const uploadData = new FormData();
        uploadData.append("file", avatarFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || "Failed to upload photo.");
        avatarUrl = uploadJson.url;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim(), avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      await update({ githubUsername: data.effectiveName, avatarUrl: data.avatarUrl });
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
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group rounded-full shrink-0"
                  title="Change profile photo"
                >
                  <Avatar src={avatarPreview || user?.avatarUrl} name={user?.githubUsername} size="lg" />
                  <span className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.25 2.25 0 015.328 7.5h-.578a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-.578a2.25 2.25 0 01-1.5-1.325l-.575-1.15A2.25 2.25 0 0015.628 4.5h-7.256a2.25 2.25 0 00-2.014 1.25L6.827 6.175zM16.5 13.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[var(--color-text-primary)]">
                    Edit Profile
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Change your name and photo — click the avatar to pick a new photo
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border border-[var(--color-border)]">
                  {error}
                </div>
              )}

              {/* autoComplete="off" plus the password-manager-specific
                  opt-outs below stop browser extensions (LastPass,
                  1Password, Dashlane, etc.) from treating this as a
                  saveable credential form and repeatedly prompting to
                  save/update — no actual credential is ever entered here. */}
              <form onSubmit={handleSave} className="space-y-4" autoComplete="off">
                <Input
                  label="Display Name"
                  id="display-name"
                  name="display-name"
                  type="text"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
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
