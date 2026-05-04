import { createClient } from '@supabase/supabase-js'

export type Booking = {
  id: string
  name: string
  phone: string
  line_id: string | null
  num_people: number
  booking_date: string
  time_slot: string
  total_price: number
  deposit: number
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_confirmed: boolean
  reminder_sent: boolean
  created_at: string
  confirmed_at: string | null
  calendar_event_id: string | null
}

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
