"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const CATEGORIES = [
  "Research",
  "Design",
  "Documentation",
  "Testing",
  "Meeting",
  "Other",
];

export default function ContributionForm({ onSuccess }) {
  const [form, setForm] = useState({
    category: "",
    description: "",
    time_estimate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.category || !form.description || !form.time_estimate) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          description: form.description,
          time_estimate: Number(form.time_estimate),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess("Contribution logged successfully!");
      setForm({ category: "", description: "", time_estimate: "" });
      onSuccess?.();

      // Clear success message after 3s
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 animate-scale-in">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 animate-scale-in">
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
          {CATEGORIES.map((c) => (
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
