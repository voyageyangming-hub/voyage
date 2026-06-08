import { getSupabaseAdmin } from '@/lib/supabase'

function checkAuth(request: Request) {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return Response.json({ error: '未授權' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('menu_items')
    .update(body)
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return Response.json({ error: '未授權' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('menu_items').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
