import { getSupabaseAdmin } from '@/lib/supabase'
import { sendBookingReminder } from '@/lib/line'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  const target = new Date(now)
  target.setDate(target.getDate() + 3)
  const targetDate = target.toLocaleDateString('sv-SE')

  const supabaseAdmin = getSupabaseAdmin()
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('booking_date', targetDate)
    .eq('payment_confirmed', true)
    .eq('reminder_sent', false)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  for (const booking of bookings || []) {
    if (!booking.line_id) continue
    try {
      await sendBookingReminder(booking.line_id, {
        name: booking.name,
        booking_date: booking.booking_date,
        time_slot: booking.time_slot,
        num_people: booking.num_people,
      })
      await supabaseAdmin
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', booking.id)
      sent++
    } catch (err) {
      console.error(`Reminder failed for ${booking.id}:`, err)
    }
  }

  return Response.json({ date: targetDate, total: bookings?.length ?? 0, sent })
}
