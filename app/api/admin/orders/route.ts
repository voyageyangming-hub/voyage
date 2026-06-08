import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function checkAuth(request: Request) {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return Response.json({ error: '未授權' }, { status: 401 })

  const url = new URL(request.url)
  const date = url.searchParams.get('date') // YYYY-MM-DD

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (date) {
    query = query
      .gte('created_at', `${date}T00:00:00+08:00`)
      .lte('created_at', `${date}T23:59:59+08:00`)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
