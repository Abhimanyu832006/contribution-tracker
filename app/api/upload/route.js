import { auth } from "@/auth";
import { isFaculty } from "@/lib/auth";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
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
const MAX_FILES = 10;

// Uploads to Vercel Blob rather than local disk — serverless functions
// have a read-only filesystem outside /tmp, and even /tmp doesn't
// persist across invocations, so writing to disk here always fails (or
// silently loses the file) once deployed. Accepts one or many files
// under the "file" field in one multipart request, for the Log
// Contribution form's multi-file picker.
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
    const files = formData.getAll("file").filter((f) => typeof f !== "string");

    if (files.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `You can upload at most ${MAX_FILES} files at once.` }, { status: 400 });
    }

    const uploaded = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `"${file.name}" exceeds the 25 MB limit` },
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

      const rawBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
      const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const blobPath = `contributions/${rawBase || "file"}_${uniqueSuffix}${ext}`;

      const blob = await put(blobPath, file, {
        access: "public",
        contentType: file.type || undefined,
      });

      uploaded.push({
        url: blob.url,
        name: originalName,
        size: file.size,
        type: file.type || ext.replace(".", ""),
      });
    }

    // Single-file callers (nothing else in the codebase multi-uploads
    // yet outside the new form) get the flat shape back for
    // backward-compat; `files` always carries the full list.
    return NextResponse.json({ ...uploaded[0], files: uploaded });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
