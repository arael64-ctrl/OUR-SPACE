import { serialize } from "cookie";

export async function handler(event) {
  const { password } = JSON.parse(event.body || "{}");

  if (password !== process.env.APP_SHARED_PASSWORD) {
    return {
      statusCode: 401,
      body: "Invalid password"
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": serialize("ourspace_auth", "true", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    },
    body: "OK"
  };
}
