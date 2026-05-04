'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(data => { setBooking(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400">載入中…</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-500">找不到預約資料</div>
      </div>
    )
  }

  const [y, m, d] = booking.booking_date.split('-')
  const dateStr = `${y} 年 ${parseInt(m)} 月 ${parseInt(d)} 日`
  const endHour = String(parseInt(booking.time_slot.split(':')[0]) + 2).padStart(2, '0')
  const endTime = `${endHour}:00`

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-stone-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">預約成立！</h1>
          <p className="text-stone-500 text-sm">請在 1 小時內完成訂金匯款以確認預約</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-stone-700 mb-4">預約摘要</h2>
          <div className="space-y-3 text-sm">
            <Row label="姓名" value={booking.name} />
            <Row label="電話" value={booking.phone} />
            <Row label="入園日期" value={dateStr} />
            <Row label="入園時段" value={`${booking.time_slot} – ${endTime}`} />
            <Row label="入園人數" value={`${booking.num_people} 人`} />
            <Row label="應付訂金" value={`NT$ ${booking.deposit}`} highlight />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-5">
          <h2 className="font-semibold text-amber-800 mb-4">匯款資訊</h2>
          <div className="space-y-3 text-sm">
            <Row label="銀行" value="國泰世華銀行" />
            <Row label="帳號" value="012-03-0012346" mono />
            <Row label="戶名" value="驚豔台灣文創工作室孫元亨" />
            <Row label="金額" value={`NT$ ${booking.deposit}`} highlight />
            <Row label="期限" value="1 小時內" />
          </div>
          <p className="text-xs text-amber-700 mt-4 bg-amber-100 rounded-lg px-3 py-2">
            ⚠️ 匯款完成後請保留截圖，我們確認後會透過 LINE 通知您
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 text-center">
          <p className="text-sm text-stone-500 mb-1">有任何問題請聯繫我們</p>
          <p className="text-sm font-medium text-green-700">Voyage 陽明山</p>
        </div>
      </div>
    </main>
  )
}

function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-stone-500">{label}</span>
      <span className={`font-medium ${highlight ? 'text-green-700 text-base' : 'text-stone-800'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
