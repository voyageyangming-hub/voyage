import { getSupabaseAdmin } from '@/lib/supabase'
import { sendPaymentConfirmed } from '@/lib/line'
import { addCalendarEvent } from '@/lib/calendar'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-password')
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: '未授權' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) return Response.json({ error: '缺少預約 ID' }, { status: 400 })

    const supabaseAdmin = getSupabaseAdmin()

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      return Response.json({ error: '找不到預約' }, { status: 404 })
    }

    if (booking.payment_confirmed) {
      return Response.json({ error: '已確認過了' }, { status: 400 })
    }

    let calendarEventId: string | null = null
    try {
      calendarEventId = await addCalendarEvent(booking)
    } catch (calErr) {
      console.error('Google Calendar error:', calErr)
    }

    await supabaseAdmin
      .from('bookings')
      .update({
        payment_confirmed: true,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        calendar_event_id: calendarEventId,
      })
      .eq('id', id)

    if (booking.line_id) {
      try {
        await sendPaymentConfirmed(booking.line_id, {
          name: booking.name,
          booking_date: booking.booking_date,
          time_slot: booking.time_slot,
          num_people: booking.num_people,
        })
      } catch (lineErr) {
        console.error('LINE send failed:', lineErr)
      }
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
