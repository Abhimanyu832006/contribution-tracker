import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { getActiveMembership, isFaculty } from "@/lib/auth";
import { refreshGoogleAccessToken } from "@/lib/googleAuth";
import { NextResponse } from "next/server";

// Best-effort word count for one doc, via Drive's plain-text export of a
// Google Doc (works with the same drive.readonly scope already granted —
// no separate Docs API scope needed). Feeds the Reports scoring system;
// a failure here just means that doc scores as 0 words, not a sync
// failure, since the doc itself still gets recorded either way.
async function fetchDocWordCount(fileId, accessToken) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return null;
    const text = await res.text();
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  } catch (err) {
    console.error(`Failed to fetch word count for doc ${fileId}:`, err);
    return null;
  }
}

// POST /api/projects/sync-google-docs — sync Google Docs from the
// project's configured Drive folder as contributions. Mirrors
// sync-github's shape: resolve the leader's stored credentials, fetch
// the source API, skip anything already synced (by a stable external
// id), insert the rest in one batched query.
export async function POST() {
  try {
    await ensureSchema();

    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isFaculty(session)) {
      return NextResponse.json(
        { error: "Forbidden: Faculty accounts cannot trigger a Google Docs sync." },
        { status: 403 }
      );
    }

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You must belong to a project to sync documents." },
        { status: 403 }
      );
    }

    const { rows: projects } = await pool.query(
      `SELECT p.id, p.google_folder_id, p.leader_id, u.google_refresh_token
       FROM projects p
       LEFT JOIN users u ON u.id = p.leader_id
       WHERE p.id = $1`,
      [membership.project_id]
    );
    const project = projects[0];

    if (!project || !project.google_folder_id) {
      return NextResponse.json(
        { error: "No Google Drive folder configured for this project. Please configure it in Settings." },
        { status: 400 }
      );
    }

    const refreshToken = project.google_refresh_token;
    if (!refreshToken) {
      return NextResponse.json(
        { error: "The project leader has not connected a Google account. Please ask the leader to connect Google Drive in Settings." },
        { status: 400 }
      );
    }

    let accessToken;
    try {
      const tokens = await refreshGoogleAccessToken(refreshToken);
      accessToken = tokens.access_token;
      await pool.query(
        "UPDATE users SET google_access_token = $1, google_token_expiry = $2 WHERE id = $3",
        [accessToken, Date.now() + (tokens.expires_in || 3600) * 1000, project.leader_id]
      );
    } catch (err) {
      console.error("Failed to refresh Google access token:", err);
      return NextResponse.json(
        { error: "Google authentication expired or was revoked. Please ask the project leader to reconnect Google Drive in Settings." },
        { status: 401 }
      );
    }

    // List Google Docs (not other Drive file types) directly inside the
    // configured folder, most-recently-modified first, capped at 100 per
    // sync the same way the GitHub sync caps at 100 commits.
    let files = [];
    try {
      const q = `'${project.google_folder_id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`;
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=100&orderBy=modifiedTime desc&fields=${encodeURIComponent("files(id,name,webViewLink,modifiedTime,owners(emailAddress,displayName))")}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!driveRes.ok) {
        const driveErr = await driveRes.json().catch(() => ({}));
        if (driveRes.status === 404) {
          return NextResponse.json(
            { error: "Google Drive folder not found or not accessible with the leader's Google account." },
            { status: 404 }
          );
        }
        if (driveRes.status === 401) {
          return NextResponse.json(
            { error: "Google authentication expired or invalid. Please ask the project leader to reconnect Google Drive." },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { error: driveErr.error?.message || `Google Drive returned error status ${driveRes.status}` },
          { status: 400 }
        );
      }

      const data = await driveRes.json();
      files = data.files || [];
    } catch (err) {
      console.error("Failed to fetch from Google Drive API:", err);
      return NextResponse.json(
        { error: "Failed to fetch documents from Google Drive. Please try again later." },
        { status: 502 }
      );
    }

    const [{ rows: existingDocs }, { rows: projectMembers }] = await Promise.all([
      pool.query(
        "SELECT doc_id FROM contributions WHERE project_id = $1 AND doc_id IS NOT NULL",
        [membership.project_id]
      ),
      pool.query(
        `SELECT u.id, u.github_username, u.display_name
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = $1`,
        [membership.project_id]
      ),
    ]);
    const existingIds = new Set(existingDocs.map((d) => d.doc_id));

    // Attribute each doc to whichever project member owns it in Drive,
    // the same way sync-github matches a commit's author to a member:
    // by email-local-part, then by normalized display name. Google
    // Docs created inside the shared folder keep their creator as
    // "owner" even after sharing, so this reflects who actually wrote
    // the doc rather than whoever happened to click Sync — unlike a
    // GitHub login, Drive's owner identity is a Google account, so the
    // match is against whatever name/email that Google account shows,
    // not a stored email column (this app doesn't collect student email
    // addresses). Anything that doesn't match falls back to whoever ran
    // the sync, same as before.
    function findMatchingMember(owner) {
      if (!owner) return null;
      const email = owner.emailAddress;
      if (email) {
        const prefix = email.split("@")[0].toLowerCase();
        const match = projectMembers.find(
          (m) => m.github_username.toLowerCase() === prefix
        );
        if (match) return match;
      }
      const name = owner.displayName;
      if (name) {
        const normalized = name.replace(/\s+/g, "").toLowerCase();
        const match = projectMembers.find(
          (m) =>
            m.github_username.replace(/\s+/g, "").toLowerCase() === normalized ||
            (m.display_name || "").replace(/\s+/g, "").toLowerCase() === normalized
        );
        if (match) return match;
      }
      return null;
    }

    let skipped = 0;
    let unmatched = 0;
    const newFiles = [];
    for (const file of files) {
      if (!file.id) continue;
      if (existingIds.has(file.id)) {
        skipped++;
        continue;
      }
      const owner = file.owners?.[0];
      const matchedMember = findMatchingMember(owner);
      if (!matchedMember) unmatched++;
      newFiles.push({ ...file, matchedUserId: matchedMember?.id || session.user.dbId });
    }

    // One export request per new doc — sequential, not Promise.all, so a
    // batch of many new docs doesn't fire dozens of concurrent requests
    // against Drive at once.
    const wordCounts = [];
    for (const file of newFiles) {
      wordCounts.push(await fetchDocWordCount(file.id, accessToken));
    }

    const toInsert = newFiles.map((file, i) => [
      membership.project_id,
      file.matchedUserId,
      "google_docs",
      "Documentation",
      (file.name || "Google Doc").substring(0, 255),
      0.0, // 0.0 hours default per doc, same convention as synced commits
      "approved", // Auto-approved for a verified Drive source, same as GitHub
      file.id,
      file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
      file.modifiedTime || new Date().toISOString(),
      wordCounts[i],
    ]);

    let added = 0;
    if (toInsert.length > 0) {
      const cols = 11;
      const values = [];
      const placeholders = toInsert.map((row, i) => {
        values.push(...row);
        const base = i * cols;
        return `(${Array.from({ length: cols }, (_, j) => `$${base + j + 1}`).join(", ")})`;
      });

      await pool.query(
        `INSERT INTO contributions (project_id, user_id, source, category, description, time_estimate, status, doc_id, doc_url, created_at, word_count)
         VALUES ${placeholders.join(", ")}`,
        values
      );
      added = toInsert.length;
    }

    return NextResponse.json({ success: true, added, skipped, unmatched });
  } catch (err) {
    console.error("POST /api/projects/sync-google-docs error:", err);
    return NextResponse.json(
      { error: "Failed to synchronize Google Docs" },
      { status: 500 }
    );
  }
}
