/**
 * System-generated Contribution Score.
 *
 * Deliberately a plain, disclosed formula over figures the team can
 * already see in the same report — not a black-box "AI rating". Anyone
 * can recompute a teammate's score by hand from the columns next to it.
 *
 * Computed PER CONTRIBUTION (using that contribution's own hours/source/
 * word count and its own peer-verification status), then summed across
 * all of a member's contributions to get their total score — a
 * contribution only ever counts toward exactly one of hours/GitHub/docs,
 * since a contribution has exactly one source.
 *
 *   raw   = hours×1.25 + GitHub×2 + docs×1 + (doc words÷100)×1
 *   score = max(0, raw × verification multiplier)
 *
 * The multiplier is what a single contribution's own peer-review outcome
 * is worth: verified counts in full, a still-pending (or contested)
 * contribution counts at half weight until the team actually verifies
 * it, and a flagged contribution counts for nothing.
 */
export const SCORE_WEIGHTS = {
  perHour: 1.25,
  perCommit: 2,
  perDoc: 1,
  perHundredWords: 1,
};

export const VERIFICATION_MULTIPLIER = {
  verified: 1,
  approved: 1, // legacy alias for verified
  pending: 0.5,
  contested: 0.5, // tied vote, not yet resolved — treated like pending
  flagged: 0,
};

/**
 * @param {object} c
 * @param {number} c.hours        - hours for this contribution (manual entries only; 0 otherwise)
 * @param {number} c.githubCount  - 1 if this contribution is a GitHub commit, else 0
 * @param {number} c.docsCount    - 1 if this contribution is a synced Google Doc, else 0
 * @param {number} c.docsWordCount - word count for this contribution (Google Docs only; 0 otherwise)
 * @param {string} c.status       - this contribution's own status (verified/approved/pending/contested/flagged)
 */
export function computeContributionScore(c) {
  const hours = Number(c.hours) || 0;
  const githubCount = Number(c.githubCount) || 0;
  const docsCount = Number(c.docsCount) || 0;
  const docsWordCount = Number(c.docsWordCount) || 0;

  const raw =
    hours * SCORE_WEIGHTS.perHour +
    githubCount * SCORE_WEIGHTS.perCommit +
    docsCount * SCORE_WEIGHTS.perDoc +
    (docsWordCount / 100) * SCORE_WEIGHTS.perHundredWords;

  const multiplier = VERIFICATION_MULTIPLIER[c.status] ?? 0.5;

  // Never negative — a bad week shouldn't produce a score that reads as
  // "worse than having done nothing at all."
  return Math.max(raw * multiplier, 0);
}
