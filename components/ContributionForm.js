"use client";

import { useState, useRef } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { CATEGORY_NAMES } from "@/lib/constants";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["doc", "docx"].includes(ext)) {
    return (
      <svg className="w-5 h-5 text-[var(--color-github)] shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h2.2l1.3 4.2 1.3-4.2H15l-2.2 7h-1.6L10 14.8 8.8 19H7.2L5 12h1.6l1.4 4.8 1.4-4.8z" />
      </svg>
    );
  }
  if (["pdf"].includes(ext)) {
    return (
      <svg className="w-5 h-5 text-[var(--color-danger)] shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zm5.5 2h1v-3h-1v3zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-[var(--color-primary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export default function ContributionForm({ onSuccess }) {
  const [form, setForm] = useState({
    category: "",
    description: "",
    time_estimate: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setError("File exceeds 25 MB limit.");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  }

  function removeFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.category || !form.description || !form.time_estimate) {
      setError("All required fields must be filled.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentMetadata = {};

      // 1. Upload file if selected
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadJson.error || "Failed to upload supporting document.");
        }

        attachmentMetadata = {
          attachment_url: uploadJson.url,
          attachment_name: uploadJson.name,
          attachment_size: uploadJson.size,
          attachment_type: uploadJson.type,
        };
      }

      // 2. Submit contribution
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          description: form.description,
          time_estimate: Number(form.time_estimate),
          ...attachmentMetadata,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess("Contribution logged successfully with supporting documents!");
      setForm({ category: "", description: "", time_estimate: "" });
      removeFile();
      onSuccess?.();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isDoc = form.category === "Documentation";
  const isResearch = form.category === "Research";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] border-2 border-[var(--color-border)] rounded px-4 py-3 animate-scale-in">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-success)] bg-[var(--color-success-light)] border-2 border-[var(--color-border)] rounded px-4 py-3 animate-scale-in">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          <option value="">Select category…</option>
          {CATEGORY_NAMES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Input
          label="Hours"
          id="time_estimate"
          name="time_estimate"
          type="number"
          min="0.1"
          step="0.1"
          value={form.time_estimate}
          onChange={handleChange}
          placeholder="0.0"
        />
      </div>

      <Input
        label="Description"
        id="description"
        name="description"
        type="text"
        value={form.description}
        onChange={handleChange}
        placeholder="What did you work on?"
      />

      {/* Supporting Document Upload Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {isDoc
              ? "Attach Documentation File (.docx, .doc, .pdf)"
              : isResearch
              ? "Attach Research Material (PDF, DOCX, datasets, slides, zip)"
              : "Supporting Document (Optional)"}
          </label>
          <span className="text-xs text-[var(--color-text-muted)]">Max 25 MB</span>
        </div>

        {selectedFile ? (
          <div className="flex items-center justify-between p-3.5 bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded animate-scale-in">
            <div className="flex items-center gap-3 min-w-0">
              {getFileIcon(selectedFile.name)}
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] rounded border-2 border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-danger-light)] transition-colors ml-2"
              title="Remove file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition-colors ${
              isDoc || isResearch
                ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                : "border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-primary-light)]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept={
                isDoc
                  ? ".doc,.docx,.pdf,.odt,.txt,.md"
                  : isResearch
                  ? ".pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.txt,.zip,.tar.gz,.png,.jpg,.jpeg"
                  : "*/*"
              }
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-primary)] font-semibold hover:underline">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {isDoc
                  ? "Word files (.docx, .doc), PDFs, or Markdown"
                  : isResearch
                  ? "Research papers, surveys, spreadsheets, presentations, or data archives"
                  : "Any document, report, or screenshot"}
              </p>
            </div>
          </div>
        )}
      </div>

      <Button
        id="submit-contribution"
        type="submit"
        loading={submitting}
        className="w-full sm:w-auto"
      >
        Log Contribution
      </Button>
    </form>
  );
}

