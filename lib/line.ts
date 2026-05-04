import { messagingApi } from '@line/bot-sdk'

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

export async function sendBookingConfirmation(lineId: string, booking: {
  name: string
  booking_date: string
  time_slot: string
  num_people: number
  deposit: number
}) {
  const endTime = getEndTime(booking.time_slot)
  const message = `🌿 Voyage 陽明山 預約成功通知

親愛的 ${booking.name}，您好！

您的入園預約已成立，請在期限內完成訂金匯款。

📅 入園日期：${formatDate(booking.booking_date)}
⏰ 入園時段：${booking.time_slot} – ${endTime}
👥 人數：${booking.num_people} 人
💰 應付訂金：NT$ ${booking.deposit}

────────────────
💳 匯款資訊
銀行：國泰世華銀行
帳號：012-03-0012346
戶名：驚豔台灣文創工作室孫元亨
────────────────

⚠️ 請於 1 小時內完成匯款，並保留轉帳截圖。
匯款完成後，我們會盡快為您確認預約。

如有疑問請直接回覆此訊息，謝謝！`

  await client.pushMessage({
    to: lineId,
    messages: [{ type: 'text', text: message }],
  })
}

export async function sendPaymentConfirmed(lineId: string, booking: {
  name: string
  booking_date: string
  time_slot: string
  num_people: number
}) {
  const endTime = getEndTime(booking.time_slot)
  const message = `✅ 訂金確認完成！

親愛的 ${booking.name}，您好！

我們已收到您的訂金，預約正式確認！

📅 入園日期：${formatDate(booking.booking_date)}
⏰ 入園時段：${booking.time_slot} – ${endTime}
👥 人數：${booking.num_people} 人

期待在陽明山與您相見 🌸
如有任何問題歡迎隨時聯繫我們！`

  await client.pushMessage({
    to: lineId,
    messages: [{ type: 'text', text: message }],
  })
}

export async function sendBookingReminder(lineId: string, booking: {
  name: string
  booking_date: string
  time_slot: string
  num_people: number
}) {
  const endTime = getEndTime(booking.time_slot)
  const message = `🔔 入園提醒 — 還有 3 天！

親愛的 ${booking.name}，您好！

提醒您，距離您的 Voyage 陽明山入園只剩 3 天！

📅 入園日期：${formatDate(booking.booking_date)}
⏰ 入園時段：${booking.time_slot} – ${endTime}
👥 人數：${booking.num_people} 人

入園當天請攜帶預約確認截圖，準時到場。
如需更改或取消，請提前告知，謝謝！

期待與您相見 🌿`

  await client.pushMessage({
    to: lineId,
    messages: [{ type: 'text', text: message }],
  })
}

function getEndTime(startTime: string): string {
  const [h] = startTime.split(':').map(Number)
  return `${String(h + 2).padStart(2, '0')}:00`
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y} 年 ${parseInt(m)} 月 ${parseInt(d)} 日`
}
