"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
        Something went wrong.
      </p>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        {error?.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => reset()}
        className="mt-1 rounded-md px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Try again
      </button>
    </div>
  );
}
