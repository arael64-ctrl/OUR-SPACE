import { createClient } from "@supabase/supabase-js";
import cookie from "cookie";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  const cookies = cookie.parse(event.headers.cookie || "");
  if (cookies.ourspace_auth !== "true") {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // GET = load entries
  if (event.httpMethod === "GET") {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { statusCode: 500, body: error.message };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  }

  // POST = save entry
  if (event.httpMethod === "POST") {
    const entry = JSON.parse(event.body);

    const { error } = await supabase.from("entries").insert(entry);

    if (error) {
      return { statusCode: 500, body: error.message };
    }

    return {
      statusCode: 200,
      body: "Saved"
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
}
