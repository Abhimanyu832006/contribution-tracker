import { auth } from "@/auth";
import { buildGoogleAuthUrl } from "@/lib/googleAuth";
import { NextResponse } from "next/server";
import crypto from "crypto";

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

// GET /api/auth/google/connect — kicks off the "connect Google Drive"
// consent flow. Any signed-in user can start this (the sync endpoint is
// what actually requires the connecting user to be the project leader),
// mirroring how GitHub's token is simply whatever the signed-in user has.
export async function GET() {
  const session = await auth();
  if (!session?.user?.dbId) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const url = new URL("/settings", baseUrl);
    url.searchParams.set("google_error", "not_configured");
    return NextResponse.redirect(url);
  }

  // CSRF guard for the OAuth round trip — verified against this same
  // cookie in the callback route.
  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildGoogleAuthUrl(state));
  res.cookies.set("google_oauth_state", state, {
    path: "/",
    maxAge: 600,
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}
