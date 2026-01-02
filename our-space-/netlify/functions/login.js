import { createClient } from "@supabase/supabase-js";
import cookie from "cookie";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body || "{}");
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "Missing email/password" }) };
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: error.message }) };
    }

    // Store refresh token in httpOnly cookie (browser can’t mess with it)
    const refresh = data?.session?.refresh_token;
    if (!refresh) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: "No session returned" }) };
    }

    const isSecure = (event.headers["x-forwarded-proto"] || "").includes("https");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie.serialize("os_refresh", refresh, {
          httpOnly: true,
          secure: isSecure,
          sameSite: "Lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
      },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || String(e) }) };
  }
}
