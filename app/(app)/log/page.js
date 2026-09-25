"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import ContributionForm from "@/components/ContributionForm";

export default function LogPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
          Log Contribution
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Record work you&apos;ve done — code, research, design, meetings, and more.
        </p>
      </div>

      <Card accent="manual">
        <ContributionForm
          onSuccess={() => {
            router.push("/contributions");
            router.refresh();
          }}
        />
      </Card>
    </div>
  );
}
