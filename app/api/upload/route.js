import { auth } from "@/auth";
import { isFaculty } from "@/lib/auth";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// Allowed extensions for documentation, research, and project attachments
const ALLOWED_EXTENSIONS = new Set([
  // Documents
  ".doc", ".docx", ".pdf", ".odt", ".rtf", ".txt", ".md",
  // Research Data & Spreadsheets
  ".xlsx", ".xls", ".csv", ".tsv", ".json",
  // Presentations
  ".ppt", ".pptx",
  // Images
  ".png", ".jpg", ".jpeg", ".webp", ".svg",
  // Archives & Datasets
  ".zip", ".tar.gz", ".rar", ".7z"
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isFaculty(session)) {
      return NextResponse.json(
        { error: "Forbidden: Faculty accounts cannot upload attachments." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 25 MB limit" },
        { status: 400 }
      );
    }

    const originalName = file.name || "document";
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `File type ${ext || "unknown"} is not allowed. Supported formats: .docx, .pdf, .xlsx, .csv, .pptx, .txt, .zip, and images.`
        },
        { status: 400 }
      );
    }

    // Sanitize base name
    const rawBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const safeFilename = `${rawBase || "file"}_${uniqueSuffix}${ext}`;

    // Stored outside `public/` so files are never reachable by a bare URL
    // guess — they're only served via the authenticated, project-scoped
    // /api/uploads/[filename] route (see app/api/uploads/[filename]/route.js).
    const uploadsDir = path.join(process.cwd(), "private-uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, safeFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/api/uploads/${safeFilename}`,
      name: originalName,
      size: file.size,
      type: file.type || ext.replace(".", "")
    });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
