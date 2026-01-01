import { serialize } from "cookie";

export async function handler() {
  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": serialize("ourspace_auth", "", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/",
        maxAge: 0
      })
    },
    body: "Logged out"
  };
}
