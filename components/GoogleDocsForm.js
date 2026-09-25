"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

const OAUTH_ERROR_MESSAGES = {
  not_configured: "Google integration is not configured on this server (missing GOOGLE_CLIENT_ID/SECRET).",
  access_denied: "Google sign-in was cancelled or denied.",
  invalid_state: "The Google sign-in request expired or was invalid. Please try again.",
  exchange_failed: "Failed to complete Google sign-in. Please try again.",
};

/**
 * Google Drive/Docs integration settings — mirrors GitHubRepoForm's
 * layout and behavior, but needs one extra step first: connecting a
 * Google account (a separate OAuth grant from the app's GitHub login),
 * since this app's login provider doesn't touch Google at all.
 */
export default function GoogleDocsForm({ initialFolderId = "", isLeader = false, googleConnected = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [folderId, setFolderId] = useState(initialFolderId);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [syncResult, setSyncResult] = useState(null);

  const hasFolderLinked = !!initialFolderId;

  // Surface the redirect status from /api/auth/google/callback, then
  // strip the query params so a refresh doesn't re-show the banner. A
  // one-time "read the URL this mount, sync it into local banner state"
  // effect — the exact case react-hooks/set-state-in-effect flags, but
  // there's no external-system subscription to model this as instead.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const connected = searchParams.get("google_connected");
    const oauthError = searchParams.get("google_error");
    if (connected) {
      setSuccess("Google account connected successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } else if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] || "Failed to connect Google account.");
    }
    if (connected || oauthError) {
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSaveFolder(e) {
    e.preventDefault();
    if (!isLeader) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleFolderId: folderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setSuccess("Google Drive folder saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setError("");
    setSuccess("");
    setSyncResult(null);
    setSyncing(true);

    try {
      const res = await fetch("/api/projects/sync-google-docs", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync Google Docs.");
      }
      setSyncResult(data);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-black uppercase tracking-tight text-[var(--color-text-primary)]">
          Google Docs Integration
        </h2>
        {hasFolderLinked ? (
          <Badge variant="green">Connected</Badge>
        ) : (
          <Badge variant="default">Not Linked</Badge>
        )}
      </div>

      <Card accent="docs" className="space-y-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 shrink-0 mt-0.5" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M38 6H16a4 4 0 00-4 4v28a4 4 0 004 4h22a4 4 0 004-4V16z" />
            <path fill="#A0C3FF" d="M38 16H26V6z" />
            <path fill="#fff" d="M18 24h16v2H18zm0 5h16v2H18zm0 5h10v2H18z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Drive Folder Sync</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Connect a Google account and point at a Drive folder to automatically pull its Google Docs in as Documentation contributions.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border border-[var(--color-border)] animate-scale-in">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-success)] bg-[var(--color-success-light)] rounded px-4 py-3 border border-[var(--color-border)] animate-scale-in">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {syncResult && (
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-contributions)] bg-[var(--color-contributions-light)] rounded px-4 py-3 border border-[var(--color-border)] animate-scale-in">
            Synced {syncResult.added} new doc{syncResult.added === 1 ? "" : "s"}
            {syncResult.skipped > 0 ? ` (${syncResult.skipped} already synced)` : ""}.
            {syncResult.unmatched > 0
              ? ` ${syncResult.unmatched} doc${syncResult.unmatched === 1 ? "" : "s"} couldn't be matched to a team member by owner and ${syncResult.unmatched === 1 ? "was" : "were"} credited to whoever ran the sync.`
              : ""}
          </div>
        )}

        {!isLeader ? (
          <p className="text-xs font-bold text-[var(--color-warning)] bg-[var(--color-warning-light)] border border-[var(--color-border)] rounded px-3 py-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 0010 5z" clipRule="evenodd" />
            </svg>
            Only the project leader can manage Google Docs integration.
          </p>
        ) : !googleConnected ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Deliberately a real anchor, not next/link — this must be a
                full browser navigation (GET to our own API route, which
                302s straight on to Google's consent screen), not a
                client-side route transition. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/google/connect" className="inline-block">
              <Button type="button" variant="secondary">
                Connect Google Account
              </Button>
            </a>
            <p className="text-xs text-[var(--color-text-muted)]">
              You&apos;ll be asked to grant read-only access to Google Drive.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveFolder} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <Input
                  label="Google Drive Folder ID"
                  id="google-folder-id"
                  name="folderId"
                  type="text"
                  disabled={saving}
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  placeholder="e.g. 1a2B3cD4EfGhIjKlMnOpQrStUvWxYz"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Open the folder in Google Drive — the ID is the last part of its URL (after <code>/folders/</code>).
                </p>
              </div>
              <Button id="save-google-folder" type="submit" loading={saving} className="w-full sm:w-auto shrink-0">
                Save Folder
              </Button>
            </div>

            {hasFolderLinked && (
              <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Pull in any new Google Docs added to the folder.
                </p>
                <Button
                  id="sync-google-docs"
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={syncing}
                  onClick={handleSync}
                >
                  Sync Now
                </Button>
              </div>
            )}
          </form>
        )}
      </Card>
    </section>
  );
}
