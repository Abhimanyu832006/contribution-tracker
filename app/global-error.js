"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <p style={{ fontWeight: 600 }}>Something went wrong.</p>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
          {error?.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "0.25rem",
            borderRadius: "0.375rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "white",
            backgroundColor: "#4f46e5",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
