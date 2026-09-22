import { auth } from "@/auth";
import pool from "@/lib/db";
import { getActiveMembership } from "@/lib/auth";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// GET /api/uploads/[filename] — authenticated, project-scoped file download.
//
// Files uploaded via /api/upload are stored outside the `public/` directory
// (in `private-uploads/`) so they are never reachable by a bare URL guess.
// This route re-derives which project the file's contribution belongs to and
// only serves it to a signed-in member of that same project.
const MIME_TYPES = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv",
  ".tsv": "text/tab-separated-values",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".zip": "application/zip",
};

export async function GET(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await context.params;

    // Reject any path traversal attempt outright
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the contribution that references this file and confirm it belongs
    // to the requester's active project before serving anything.
    const { rows } = await pool.query(
      `SELECT id, project_id, attachment_name FROM contributions
       WHERE attachment_url = $1 OR attachment_url = $2
       LIMIT 1`,
      [`/api/uploads/${filename}`, `/uploads/${filename}`]
    );

    const contribution = rows[0];
    if (!contribution || contribution.project_id !== membership.project_id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), "private-uploads", filename);

    let buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${(contribution.attachment_name || filename).replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    console.error("GET /api/uploads/[filename] error:", err);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}
