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

    // Fetch the project details (repository owner and name)
    const { rows: projects } = await pool.query(
      "SELECT id, name, repo_owner, repo_name, leader_id FROM projects WHERE id = $1",
      [membership.project_id]
    );
    const project = projects[0];

    if (!project || !project.repo_owner || !project.repo_name) {
      return NextResponse.json(
        { error: "No GitHub repository configured for this project. Please configure it in Settings." },
        { status: 400 }
      );
    }

    // Fetch the leader's access token
    const { rows: leaders } = await pool.query(
      "SELECT github_access_token FROM users WHERE id = $1",
      [project.leader_id]
    );
    const token = leaders[0]?.github_access_token;
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

    // Fetch existing project members for user mapping
    const { rows: projectMembers } = await pool.query(
      `SELECT u.id, u.github_username
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [membership.project_id]
    );

    // Fetch existing synced commit SHAs to prevent duplicates
    const { rows: existingCommits } = await pool.query(
      "SELECT commit_sha FROM contributions WHERE project_id = $1 AND commit_sha IS NOT NULL",
      [membership.project_id]
    );
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

    // Process and insert commits
    for (const commit of commits) {
      if (!commit.sha) continue;

      // Skip if already synced
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

      // Insert contribution
      await pool.query(
        `INSERT INTO contributions (project_id, user_id, source, category, description, time_estimate, status, commit_sha, commit_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          membership.project_id,
          matchedUser.id,
          "github",
          "Code",
          description.substring(0, 255),
          0.5, // 0.5 hours default per commit
          "approved", // Auto-approved for verified git source
          commit.sha,
          commitUrl,
          createdAt,
        ]
      );

      added++;
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
