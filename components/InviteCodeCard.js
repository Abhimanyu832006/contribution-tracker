"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";

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
    <Card className="flex items-center justify-between">
      <div>
        <p className="label-mono">INVITE CODE</p>
        <p className="stat-num text-3xl mt-1 tracking-widest">
          {inviteCode}
        </p>
        <p className="text-xs text-[#55503f] mt-1">
          Share this code with your teammates so they can join the project
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="font-mono uppercase tracking-wider text-xs px-4 py-2.5 border border-[#1c1a15] hover:bg-[#1c1a15] hover:text-[#f2ede3] transition-colors"
      >
        {copied ? "Copied ✓" : "Copy Code"}
      </button>
    </Card>
  );
}
