export const metadata = {
  title: "Privacy Policy — Contribution Tracker",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8 text-[var(--color-text-primary)]">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Last updated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">What this app does</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Contribution Tracker helps student teams log, verify, and report on project work.
            Students sign in with GitHub; faculty supervisors sign in with Google. A project
            leader may optionally connect a Google account to sync Google Docs from a chosen
            Drive folder as logged contributions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Data we access</h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-[var(--color-text-secondary)] space-y-1">
            <li>
              <strong>GitHub (students):</strong> your GitHub username, avatar, and public profile
              info, plus commit history for a repository you explicitly link to your project.
            </li>
            <li>
              <strong>Google Sign-In (faculty):</strong> your name, email, and profile picture —
              used only to identify your account. We do not access Drive, Docs, or any other
              Google data for faculty accounts.
            </li>
            <li>
              <strong>Google Drive/Docs sync (optional, student project leaders only):</strong> if
              you choose to connect a Google account in Settings, we request read-only access to
              Google Drive (<code>drive.readonly</code>) solely to list and read the plain-text
              content of Google Docs inside a folder you specify, so they can be logged as
              contributions. We do not modify, delete, or access any other files in your Drive.
            </li>
            <li>
              <strong>Contribution data:</strong> whatever you and your teammates log — hours,
              descriptions, categories, uploaded files, and peer votes/remarks.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">How we use this data</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Data is used exclusively to operate the app: displaying your identity to teammates,
            computing contribution reports, and syncing GitHub commits or Google Docs you&apos;ve
            explicitly connected. We do not sell, share, or use this data for advertising.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Data storage and retention</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Data is stored in a Postgres database for as long as your project exists. Uploaded
            files are stored via Vercel Blob storage. You can disconnect your Google account or
            leave a project at any time from Settings; deleting a project removes its contribution
            history.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Contact</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Questions about this policy or your data? Contact{" "}
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
