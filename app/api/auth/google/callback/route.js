import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { exchangeCodeForTokens } from "@/lib/googleAuth";
import { NextResponse } from "next/server";

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

// GET /api/auth/google/callback — Google redirects here after consent.
// Exchanges the authorization code for tokens and stores them on the
// signed-in user, then bounces back to Settings with a status flag the
// GoogleDocsForm reads to show a success/error banner.
export async function GET(request) {
  const settingsUrl = new URL("/settings", baseUrl);

  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    settingsUrl.searchParams.set("google_error", "access_denied");
    return NextResponse.redirect(settingsUrl);
  }

  const cookieState = request.cookies.get("google_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    settingsUrl.searchParams.set("google_error", "invalid_state");
    const res = NextResponse.redirect(settingsUrl);
    res.cookies.delete("google_oauth_state");
    return res;
  }

  try {
    await ensureSchema();
    const tokens = await exchangeCodeForTokens(code);
    const expiry = Date.now() + (tokens.expires_in || 3600) * 1000;

    // refresh_token is only ever included when Google actually issues one
    // (with prompt=consent it should be every time) — COALESCE so a
    // reconnect that somehow doesn't get one back doesn't wipe an
    // existing valid refresh token.
    await pool.query(
      `UPDATE users
       SET google_access_token = $1,
           google_refresh_token = COALESCE($2, google_refresh_token),
           google_token_expiry = $3
       WHERE id = $4`,
      [tokens.access_token, tokens.refresh_token || null, expiry, session.user.dbId]
    );

    settingsUrl.searchParams.set("google_connected", "1");
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    settingsUrl.searchParams.set("google_error", "exchange_failed");
  }

  const res = NextResponse.redirect(settingsUrl);
  res.cookies.delete("google_oauth_state");
  return res;
}
