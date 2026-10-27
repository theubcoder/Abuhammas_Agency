import { NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";

// In-memory rate limiting map (IP -> { count, lockedUntil })
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute lockout after 5 failed attempts

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const now = Date.now();

    // Rate limiting check
    const record = loginAttempts.get(ip);
    if (record && record.lockedUntil && record.lockedUntil > now) {
      const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return NextResponse.json(
        {
          error: `Too many failed attempts. Please wait ${waitSeconds} seconds before trying again.`,
          retryAfter: waitSeconds,
        },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { username, password, rememberMe } = body || {};

    // Input Validations
    const errors = {};
    const cleanUsername = typeof username === "string" ? username.trim() : "";
    const cleanPassword = typeof password === "string" ? password : "";

    if (!cleanUsername) {
      errors.username = "Username is required.";
    }

    if (!cleanPassword) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", errors }, { status: 422 });
    }

    // Target credentials from environment variables
    const expectedUsername = (process.env.ADMIN_USERNAME || "admin").trim();
    const expectedPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();

    // Verify credentials
    const isUserMatch =
      cleanUsername.toLowerCase() === expectedUsername.toLowerCase();
    const isPassMatch = cleanPassword === expectedPassword;

    if (!isUserMatch || !isPassMatch) {
      // Record failed attempt
      const attempts = (record?.count || 0) + 1;
      let lockedUntil = null;
      if (attempts >= MAX_ATTEMPTS) {
        lockedUntil = now + LOCKOUT_MS;
      }
      loginAttempts.set(ip, { count: attempts, lockedUntil });

      const remaining = Math.max(0, MAX_ATTEMPTS - attempts);
      const message =
        remaining > 0
          ? `Invalid username or password. (${remaining} attempts remaining before temporary lockout)`
          : `Account temporarily locked for 60 seconds due to multiple failed attempts.`;

      return NextResponse.json(
        {
          error: message,
          attemptsRemaining: remaining,
        },
        { status: 401 }
      );
    }

    // Success: reset attempts for this IP
    loginAttempts.delete(ip);

    // Create session token
    // Expiration: 30 days if remember me is checked, otherwise 24 hours
    const maxAgeSeconds = rememberMe ? 30 * 24 * 3600 : 24 * 3600;
    const token = await createSessionToken(
      {
        username: cleanUsername,
        role: "admin",
      },
      maxAgeSeconds
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        username: cleanUsername,
        role: "admin",
      },
    });

    // Set HTTP-only secure session cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (err) {
    console.error("[Login API Error]:", err);
    return NextResponse.json(
      { error: "Internal server error occurred during login." },
      { status: 500 }
    );
  }
}
