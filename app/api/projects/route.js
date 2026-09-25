import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { getActiveMembership } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

// POST /api/projects — create a new project
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    // Generate a short random invite code (8 chars, uppercase alphanumeric)
    const inviteCode = crypto
      .randomBytes(6)
      .toString("base64url")
      .slice(0, 8)
      .toUpperCase();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create the project
      const { rows: projectRows } = await client.query(
        `INSERT INTO projects (name, invite_code, leader_id)
         VALUES ($1, $2, $3)
         RETURNING id, invite_code`,
        [name.trim(), inviteCode, session.user.dbId]
      );
      const project = projectRows[0];

      // Attach the user to the project as leader
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, 'leader')
         ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'leader'`,
        [project.id, session.user.dbId]
      );

      await client.query("COMMIT");

      const cookieStore = await cookies();
      cookieStore.set("active_project_id", String(project.id), {
        path: "/",
        maxAge: 2592000,
        sameSite: "lax",
      });

      return NextResponse.json(
        {
          project_id: project.id,
          invite_code: project.invite_code,
        },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /api/projects error:", err);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects — delete the active project (leader only)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "No active project found." },
        { status: 404 }
      );
    }

    if (membership.role !== "leader") {
      return NextResponse.json(
        { error: "Forbidden: Only the project leader can delete this project." },
        { status: 403 }
      );
    }

    // Cascade delete project (schema cascade deletes project_members & contributions)
    await pool.query("DELETE FROM projects WHERE id = $1", [membership.project_id]);

    // Check if user has other projects to switch active cookie to
    const { rows: remaining } = await pool.query(
      "SELECT project_id FROM project_members WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1",
      [session.user.dbId]
    );

    const cookieStore = await cookies();
    if (remaining.length > 0) {
      cookieStore.set("active_project_id", String(remaining[0].project_id), {
        path: "/",
        maxAge: 2592000,
        sameSite: "lax",
      });
    } else {
      cookieStore.delete("active_project_id");
    }

    return NextResponse.json({ success: true, remainingProjects: remaining.length });
  } catch (err) {
    console.error("DELETE /api/projects error:", err);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects — update active project settings (leader only).
// Field-presence-aware: only touches the columns for keys actually
// present in the request body, so e.g. saving the Google Drive folder
// doesn't clobber the GitHub repo setting (and vice versa) by writing
// null over it.
export async function PATCH(request) {
  try {
    await ensureSchema();

    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "No active project found." },
        { status: 404 }
      );
    }

    if (membership.role !== "leader") {
      return NextResponse.json(
        { error: "Forbidden: Only the project leader can modify settings." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const setClauses = [];
    const values = [];
    const result = { success: true };

    if (Object.prototype.hasOwnProperty.call(body, "repo")) {
      const repo = body.repo; // expect "owner/name" or empty/null

      let repoOwner = null;
      let repoName = null;

      if (repo && repo.trim() !== "") {
        const trimmed = repo.trim();
        const match = trimmed.match(/^([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/);
        if (!match) {
          return NextResponse.json(
            { error: "Invalid repository format. Please use 'owner/name' (e.g. 'torvalds/linux')." },
            { status: 400 }
          );
        }
        repoOwner = match[1];
        repoName = match[2];

        // Fetch the leader's github_access_token
        const { rows: userRows } = await pool.query(
          "SELECT github_access_token FROM users WHERE id = $1",
          [session.user.dbId]
        );
        const token = userRows[0]?.github_access_token;
        if (!token) {
          return NextResponse.json(
            { error: "Your GitHub account does not have a valid access token. Please sign in again." },
            { status: 400 }
          );
        }

        // Call GitHub API to validate the repo exists and is accessible
        try {
          const ghRes = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "Nextjs-Contribution-Tracker",
              },
            }
          );

          if (!ghRes.ok) {
            if (ghRes.status === 404) {
              return NextResponse.json(
                { error: `Repository '${trimmed}' not found or not accessible under your GitHub account.` },
                { status: 404 }
              );
            }
            const ghErr = await ghRes.json().catch(() => ({}));
            return NextResponse.json(
              { error: ghErr.message || `GitHub returned error status ${ghRes.status}` },
              { status: 400 }
            );
          }
        } catch (err) {
          console.error("GitHub verification request failed:", err);
          return NextResponse.json(
            { error: "Failed to connect to GitHub. Please check your internet connection and try again." },
            { status: 500 }
          );
        }
      }

      setClauses.push(`repo_owner = $${values.length + 1}`);
      values.push(repoOwner);
      setClauses.push(`repo_name = $${values.length + 1}`);
      values.push(repoName);
      result.repo_owner = repoOwner;
      result.repo_name = repoName;
    }

    if (Object.prototype.hasOwnProperty.call(body, "googleFolderId")) {
      const folderId = body.googleFolderId ? String(body.googleFolderId).trim() : "";
      setClauses.push(`google_folder_id = $${values.length + 1}`);
      values.push(folderId || null);
      result.google_folder_id = folderId || null;
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: "No settings provided to update." },
        { status: 400 }
      );
    }

    values.push(membership.project_id);
    await pool.query(
      `UPDATE projects SET ${setClauses.join(", ")} WHERE id = $${values.length}`,
      values
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("PATCH /api/projects error:", err);
    return NextResponse.json(
      { error: "Failed to update project settings" },
      { status: 500 }
    );
  }
}

