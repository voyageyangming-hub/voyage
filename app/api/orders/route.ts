import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { note, payment_method, total_price, amount_paid, change_amount, items } = body

  if (!payment_method || !Array.isArray(items) || items.length === 0) {
    return Response.json({ error: '缺少必要資料' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 逐項檢查並扣庫存（stock_qty === -1 表示無限，跳過）
  for (const item of items) {
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('stock_qty, name')
      .eq('id', item.menu_item_id)
      .single()

    if (!menuItem || menuItem.stock_qty === -1) continue

    if (menuItem.stock_qty < item.quantity) {
      return Response.json(
        { error: `${menuItem.name} 庫存不足（剩餘 ${menuItem.stock_qty}）` },
        { status: 400 }
      )
    }

    await supabase
      .from('menu_items')
      .update({ stock_qty: menuItem.stock_qty - item.quantity })
      .eq('id', item.menu_item_id)
  }

  // 建立訂單
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ note, payment_method, total_price, amount_paid, change_amount })
    .select('id')
    .single()

  if (orderError) return Response.json({ error: orderError.message }, { status: 500 })

  // 建立訂單明細
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(items.map((item: any) => ({ ...item, order_id: order.id })))

  if (itemsError) return Response.json({ error: itemsError.message }, { status: 500 })

  return Response.json({ id: order.id }, { status: 201 })
}
