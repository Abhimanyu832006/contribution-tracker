/**
 * Google OAuth helpers for the Drive/Docs integration. Deliberately plain
 * `fetch` calls against Google's REST endpoints (same approach the
 * existing GitHub integration uses) rather than the `googleapis` SDK —
 * no extra dependency for what's a handful of well-documented endpoints.
 *
 * This is a separate, secondary OAuth connection (not the app's login
 * provider, which stays GitHub-only via next-auth) — a project leader
 * connects their Google account specifically to grant read access to a
 * Drive folder, the same way they link a GitHub repo after already being
 * signed in.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Read-only is all the sync needs — it only ever lists/reads Docs files,
// never writes to Drive.
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export function getGoogleRedirectUri() {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    // Forces the consent screen (and a fresh refresh_token) on every
    // connect — without this, re-connecting after a revoke wouldn't
    // reliably hand back a refresh_token.
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || "Failed to exchange authorization code for tokens");
  }
  return res.json(); // { access_token, refresh_token, expires_in, ... }
}

export async function refreshGoogleAccessToken(refreshToken) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || "Failed to refresh Google access token");
  }
  return res.json(); // { access_token, expires_in, ... }
}
