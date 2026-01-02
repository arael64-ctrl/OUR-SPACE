import { createClient } from "@supabase/supabase-js";
import cookie from "cookie";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function supabaseFromRequest(event) {
  const cookies = cookie.parse(event.headers.cookie || "");
  const refresh_token = cookies.os_refresh;
  if (!refresh_token) return { ok: false, status: 401, error: "Not signed in" };

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  // Refresh session each call so it survives refresh/expiry
  const { data, error } = await sb.auth.refreshSession({ refresh_token });
  if (error || !data?.session?.access_token) {
    return { ok: false, status: 401, error: error?.message || "Session refresh failed" };
  }

  // Return an authed client (JWT attached)
  const access_token = data.session.access_token;
  const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  return { ok: true, authed };
}

export async function handler(event) {
  const method = event.httpMethod;

  const auth = await supabaseFromRequest(event);
  if (!auth.ok) {
    return { statusCode: auth.status, body: JSON.stringify({ ok: false, error: auth.error }) };
  }
  const sb = auth.authed;

  try {
    if (method === "GET") {
      const section = (event.queryStringParameters?.section || "journal").trim();

      const { data, error } = await sb
        .from("entries")
        .select("id, created_at, section, author, title, payload")
        .eq("section", section)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, data }) };
    }

    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const section = (body.section || "journal").trim();
      const author = (body.author || "").trim();
      const title = (body.title || "").trim();
      const payload = body.payload || {};

      const { error } = await sb.from("entries").insert([{ section, author, title: title || null, payload }]);
      if (error) throw error;

      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
    }

    if (method === "DELETE") {
      const { id } = JSON.parse(event.body || "{}");
      if (!id) return { statusCode: 400, body: JSON.stringify({ ok: false, error: "Missing id" }) };

      const { error } = await sb.from("entries").delete().eq("id", id);
      if (error) throw error;

      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || String(e) }) };
  }
}
