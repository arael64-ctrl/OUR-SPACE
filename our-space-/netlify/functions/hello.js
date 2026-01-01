export default async () => {
  return new Response(
    JSON.stringify({ ok: true, msg: "Hello from Netlify Functions" }),
    { headers: { "content-type": "application/json" } }
  );
};
