import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TIME_SLOTS, MAX_PER_SLOT } from '@/lib/booking'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date) {
    return Response.json({ error: 'date required' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('time_slot, num_people')
    .eq('booking_date', date)
    .neq('status', 'cancelled')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const availability: Record<string, number> = {}
  for (const slot of TIME_SLOTS) {
    const booked = (data || [])
      .filter(b => b.time_slot === slot)
      .reduce((sum, b) => sum + b.num_people, 0)
    availability[slot] = Math.max(0, MAX_PER_SLOT - booked)
  }

  return Response.json(availability)
}
