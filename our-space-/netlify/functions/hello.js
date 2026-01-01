export async function handler() {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ok: true,
      service: "our-space",
      time: new Date().toISOString()
    })
  };
}
