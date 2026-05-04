import { getSupabaseAdmin } from '@/lib/supabase'
import { sendBookingConfirmation } from '@/lib/line'
import { calcDeposit, calcTotal, MAX_PER_SLOT, TIME_SLOTS } from '@/lib/booking'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, line_id, num_people, booking_date, time_slot } = body

    if (!name || !phone || !num_people || !booking_date || !time_slot) {
      return Response.json({ error: '請填寫所有必填欄位' }, { status: 400 })
    }

    if (!TIME_SLOTS.includes(time_slot)) {
      return Response.json({ error: '無效的時段' }, { status: 400 })
    }

    if (num_people < 1 || num_people > MAX_PER_SLOT) {
      return Response.json({ error: `人數需在 1 至 ${MAX_PER_SLOT} 之間` }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('num_people')
      .eq('booking_date', booking_date)
      .eq('time_slot', time_slot)
      .neq('status', 'cancelled')

    const booked = (existing || []).reduce((sum: number, b: any) => sum + b.num_people, 0)
    const available = MAX_PER_SLOT - booked

    if (num_people > available) {
      return Response.json(
        { error: available === 0 ? '此時段已額滿' : `此時段僅剩 ${available} 個名額` },
        { status: 409 }
      )
    }

    const deposit = calcDeposit(num_people)
    const total_price = calcTotal(num_people)

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        name,
        phone,
        line_id: line_id || null,
        num_people,
        booking_date,
        time_slot,
        total_price,
        deposit,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    if (line_id) {
      try {
        await sendBookingConfirmation(line_id, { name, booking_date, time_slot, num_people, deposit })
      } catch (lineErr) {
        console.error('LINE send failed:', lineErr)
      }
    }

    return Response.json({ id: data.id, deposit }, { status: 201 })
  } catch {
    return Response.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
