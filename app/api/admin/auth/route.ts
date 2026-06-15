export async function GET(request: Request) {
  const ok = request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
  return Response.json({ ok }, { status: ok ? 200 : 401 })
}
