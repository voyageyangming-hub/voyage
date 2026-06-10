import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('x-admin-password')
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: '未授權' }, { status: 401 })
  }

  const { id } = await params
  const { checked_in } = await request.json()
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('bookings')
    .update({ checked_in })
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('x-admin-password')
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: '未授權' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
