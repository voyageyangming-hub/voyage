import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function checkAuth(request: Request) {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return Response.json({ error: '未授權' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return Response.json({ error: '未授權' }, { status: 401 })

  const { name, category, price, stock_qty, low_stock_alert, sort_order } = await request.json()

  if (!name || !category || price === undefined) {
    return Response.json({ error: '請填寫名稱、分類與售價' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      name,
      category,
      price,
      stock_qty: stock_qty ?? -1,
      low_stock_alert: low_stock_alert ?? 5,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
