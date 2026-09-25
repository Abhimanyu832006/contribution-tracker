export const metadata = {
  title: "Terms of Service — Contribution Tracker",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8 text-[var(--color-text-primary)]">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Last updated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Overview</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Contribution Tracker is a tool for student teams to log and review project
            contributions, and for faculty supervisors to review team progress. By using this app
            you agree to these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Acceptable use</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Use this app only for legitimate academic project tracking. Don&apos;t attempt to
            access another team&apos;s project data without an invite, misrepresent contributions,
            or use the service to store or distribute unlawful content.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Accounts and data</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            You&apos;re responsible for the accuracy of what you log. See our{" "}
            <a href="/privacy" className="text-[var(--color-primary)] underline">
              Privacy Policy
            </a>{" "}
            for details on what data we access and how it&apos;s used.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">No warranty</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            This app is provided as-is, without warranty of any kind, for educational use. We
            aren&apos;t liable for any grading or assessment outcomes based on data logged here.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Contact</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Questions about these terms? Contact{" "}
            <a href="mailto:abhimanyurajawat08@gmail.com" className="text-[var(--color-primary)] underline">
              abhimanyurajawat08@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
