/**
 * System-generated Contribution Score.
 *
 * Deliberately a plain, disclosed formula over figures the team can
 * already see in the same report — not a black-box "AI rating". Anyone
 * can recompute a teammate's score by hand from the columns next to it.
 *
 * Inputs, all drawn from data already tracked elsewhere in the app:
 *   - hours:            sum of self-reported time_estimate (manual entries)
 *   - commits:          count of GitHub-synced contributions
 *   - docs:              count of Google-Docs-synced contributions
 *   - docsWordCount:     total words across those synced docs
 *   - verifiedCount:     contributions that reached peer-verified/approved
 *   - flaggedCount:      contributions the team flagged
 *
 * Weights (WEIGHTS below) are intentionally simple, round numbers so the
 * formula stays readable rather than tuned to any particular dataset —
 * treat this as a starting point to adjust, not a scientifically derived
 * constant.
 */
export const SCORE_WEIGHTS = {
  perHour: 3,
  perCommit: 2,
  perDoc: 2,
  perHundredWords: 1,
  perVerified: 1,
  perFlagged: -2,
};

export function computeContributionScore(m) {
  const hours = Number(m.total_hours) || 0;
  const commits = Number(m.github_count) || 0;
  const docs = Number(m.docs_count) || 0;
  const words = Number(m.docs_word_count) || 0;
  const verified = Number(m.verified_count) || 0;
  const flagged = Number(m.flagged_count) || 0;

  const raw =
    hours * SCORE_WEIGHTS.perHour +
    commits * SCORE_WEIGHTS.perCommit +
    docs * SCORE_WEIGHTS.perDoc +
    (words / 100) * SCORE_WEIGHTS.perHundredWords +
    verified * SCORE_WEIGHTS.perVerified +
    flagged * SCORE_WEIGHTS.perFlagged;

  // Never negative — a bad week shouldn't produce a score that reads as
  // "worse than having done nothing at all."
  return Math.round(Math.max(raw, 0) * 10) / 10;
}
