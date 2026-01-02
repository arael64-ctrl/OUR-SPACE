// netlify/functions/entries.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  try {
    if (event.httpMethod === "GET") {
      const section = event.queryStringParameters?.section || "journal";

      const { data, error } = await supabase
        .from("entries")
        .select("id, created_at, section, author, title, body")
        .eq("section", section)
        .order("created_at", { ascending: false });

      if (error) return json(500, { ok: false, error: error.message });
      return json(200, { ok: true, entries: data || [] });
    }

    if (event.httpMethod === "POST") {
      const payload = JSON.parse(event.body || "{}");
      const section = (payload.section || "journal").trim();
      const author = (payload.author || "AC").trim();
      const title = (payload.title || "").trim();
      const body = (payload.body || "").trim();

      if (!body) return json(400, { ok: false, error: "Body is required." });

      const { error } = await supabase.from("entries").insert([
        {
          section,
          author,
          title: title || null,
          body,
        },
      ]);

      if (error) return json(500, { ok: false, error: error.message });
      return json(200, { ok: true });
    }

    return json(405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    return json(500, { ok: false, error: e?.message || String(e) });
  }
};
