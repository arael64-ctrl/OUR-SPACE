import cookie from "cookie";

export async function handler() {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie.serialize("os_refresh", "", {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 0
      })
    },
    body: JSON.stringify({ ok: true })
  };
}
