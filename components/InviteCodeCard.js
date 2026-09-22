"use client";

import { useState } from "react";

export default function InviteCodeCard({ inviteCode }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = inviteCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-[3px] border-2 border-[#0e0d0b] bg-[#eab308] px-6 py-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-[#0e0d0b]/60">
          Invite code
        </p>
        <p className="stat-num text-4xl mt-1 tracking-widest text-[#0e0d0b]">
          {inviteCode}
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="font-semibold text-sm px-4 py-2.5 rounded-[3px] bg-[#0e0d0b] text-[#f4f2ec] hover:bg-white hover:text-[#0e0d0b] transition-colors shrink-0"
      >
        {copied ? "Copied ✓" : "Copy code"}
      </button>
    </div>
  );
}
