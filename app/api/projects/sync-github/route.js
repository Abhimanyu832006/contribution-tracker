import { auth } from "@/auth";
import pool from "@/lib/db";
import { getActiveMembership } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST /api/projects/sync-github — sync commits from configured GitHub repo
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You must belong to a project to sync commits." },
        { status: 403 }
      );
    }

    // Fetch the project details and the leader's access token in one round trip
    const { rows: projects } = await pool.query(
      `SELECT p.id, p.name, p.repo_owner, p.repo_name, p.leader_id, u.github_access_token
       FROM projects p
       LEFT JOIN users u ON u.id = p.leader_id
       WHERE p.id = $1`,
      [membership.project_id]
    );
    const project = projects[0];

    if (!project || !project.repo_owner || !project.repo_name) {
      return NextResponse.json(
        { error: "No GitHub repository configured for this project. Please configure it in Settings." },
        { status: 400 }
      );
    }

    const token = project.github_access_token;
    if (!token) {
      return NextResponse.json(
        { error: "The project leader does not have a valid connected GitHub token. Please ask the leader to log in again and reconnect." },
        { status: 400 }
      );
    }

    // Fetch GitHub commits (max 100 recent commits)
    let commits = [];
    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${project.repo_owner}/${project.repo_name}/commits?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "Nextjs-Contribution-Tracker",
          },
          next: { revalidate: 0 }, // bypass Next.js cache
        }
      );

      if (!ghRes.ok) {
        const ghErr = await ghRes.json().catch(() => ({}));
        const rateLimitRemaining = ghRes.headers.get("x-ratelimit-remaining");

        if (ghRes.status === 403 && rateLimitRemaining === "0") {
          const resetAt = ghRes.headers.get("x-ratelimit-reset");
          const resetTime = resetAt
            ? new Date(Number(resetAt) * 1000).toLocaleTimeString()
            : "shortly";
          return NextResponse.json(
            { error: `GitHub API rate limit exceeded. Please try syncing again after ${resetTime}.` },
            { status: 429 }
          );
        }

        if (ghRes.status === 401) {
          return NextResponse.json(
            { error: "GitHub authentication expired or invalid. Please ask the project leader to sign out and back in to reconnect." },
            { status: 401 }
          );
        }

        if (ghRes.status === 404) {
          return NextResponse.json(
            { error: "Repository not found or no longer accessible with the leader's GitHub account." },
            { status: 404 }
          );
        }

        if (ghRes.status === 409) {
          // Empty repository (no commits/branches yet) — not an error condition
          return NextResponse.json({ success: true, added: 0, skipped: 0, unmatched: 0 });
        }

        return NextResponse.json(
          { error: ghErr.message || `GitHub returned error status ${ghRes.status}` },
          { status: 400 }
        );
      }

      commits = await ghRes.json();
    } catch (err) {
      console.error("Failed to fetch from GitHub API:", err);
      return NextResponse.json(
        { error: "Failed to fetch commits from GitHub. Please try again later." },
        { status: 502 }
      );
    }

    // Fetch project members (for author matching) and already-synced SHAs
    // (to skip duplicates) in parallel — neither depends on the other.
    const [{ rows: projectMembers }, { rows: existingCommits }] = await Promise.all([
      pool.query(
        `SELECT u.id, u.github_username
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = $1`,
        [membership.project_id]
      ),
      pool.query(
        "SELECT commit_sha FROM contributions WHERE project_id = $1 AND commit_sha IS NOT NULL",
        [membership.project_id]
      ),
    ]);
    const existingShas = new Set(existingCommits.map((c) => c.commit_sha));

    let added = 0;
    let skipped = 0;
    let unmatched = 0;

    // Helper to match git author to a project member
    function findMatchingUser(commit) {
      // 1. Match by GitHub Login
      const ghLogin = commit.author?.login;
      if (ghLogin) {
        const match = projectMembers.find(
          (m) => m.github_username.toLowerCase() === ghLogin.toLowerCase()
        );
        if (match) return match;
      }

      // 2. Match by email prefix
      const email = commit.commit?.author?.email;
      if (email) {
        const prefix = email.split("@")[0].toLowerCase();
        const match = projectMembers.find(
          (m) => m.github_username.toLowerCase() === prefix
        );
        if (match) return match;
      }

      // 3. Match by normalized name (without spaces)
      const name = commit.commit?.author?.name;
      if (name) {
        const normalized = name.replace(/\s+/g, "").toLowerCase();
        const match = projectMembers.find(
          (m) => m.github_username.toLowerCase() === normalized
        );
        if (match) return match;
      }

      return null;
    }

    // Determine which commits to insert first (pure in-memory filtering),
    // then insert them all in a single batched multi-row query instead of
    // one round trip per commit.
    const toInsert = [];
    for (const commit of commits) {
      if (!commit.sha) continue;

      if (existingShas.has(commit.sha)) {
        skipped++;
        continue;
      }

      const matchedUser = findMatchingUser(commit);
      if (!matchedUser) {
        unmatched++;
        continue;
      }

      const description = commit.commit?.message?.split("\n")[0] || "GitHub Commit";
      const commitUrl = commit.html_url || `https://github.com/${project.repo_owner}/${project.repo_name}/commit/${commit.sha}`;
      const createdAt = commit.commit?.author?.date || new Date().toISOString();

      toInsert.push([
        membership.project_id,
        matchedUser.id,
        "github",
        "Code",
        description.substring(0, 255),
        0.0, // 0.0 hours default per commit (no time taken)
        "approved", // Auto-approved for verified git source
        commit.sha,
        commitUrl,
        createdAt,
      ]);
    }

    if (toInsert.length > 0) {
      const cols = 10;
      const values = [];
      const placeholders = toInsert.map((row, i) => {
        values.push(...row);
        const base = i * cols;
        return `(${Array.from({ length: cols }, (_, j) => `$${base + j + 1}`).join(", ")})`;
      });

      await pool.query(
        `INSERT INTO contributions (project_id, user_id, source, category, description, time_estimate, status, commit_sha, commit_url, created_at)
         VALUES ${placeholders.join(", ")}`,
        values
      );
      added = toInsert.length;
    }

    return NextResponse.json({
      success: true,
      added,
      skipped,
      unmatched,
    });
  } catch (err) {
    console.error("POST /api/projects/sync-github error:", err);
    return NextResponse.json(
      { error: "Failed to synchronize GitHub repository commits" },
      { status: 500 }
    );
  }
}
