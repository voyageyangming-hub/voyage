import { google } from 'googleapis'

function getOAuthClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  )
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  })
  return auth
}

export async function addCalendarEvent(booking: {
  id: string
  name: string
  phone: string
  num_people: number
  booking_date: string
  time_slot: string
}): Promise<string> {
  const auth = getOAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const [h, m] = booking.time_slot.split(':').map(Number)
  const startDate = new Date(`${booking.booking_date}T${booking.time_slot}:00+08:00`)
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID!,
    requestBody: {
      summary: `🌿 Voyage 入園 — ${booking.name} x${booking.num_people}`,
      description: `姓名：${booking.name}\n電話：${booking.phone}\n人數：${booking.num_people} 人\n預約 ID：${booking.id}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Taipei',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Taipei',
      },
    },
  })

  return event.data.id!
}
