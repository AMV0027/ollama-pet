export async function GET(request: Request) {
  console.log(">> HEALTH PING FROM:", request.headers.get("user-agent"), "IP:", request.headers.get("x-forwarded-for") || "unknown");
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
