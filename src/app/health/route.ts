export async function GET(request: Request) {
  const ua = request.headers.get('user-agent') || 'unknown';
  const ref = request.headers.get('referer') || 'none';
  const forwarded = request.headers.get('x-forwarded-for') || 'direct';
  
  console.log(`[HEALTH CHECK] UA: ${ua} | Referer: ${ref} | XFF: ${forwarded}`);
  
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    source: { ua, ref, forwarded }
  });
}