'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TIME_SLOTS, TICKET_PRICE, DEPOSIT_PER_PERSON, MAX_PER_SLOT, calcDeposit, calcTotal, getSlotEndTime } from '@/lib/booking'

const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })

export default function BookingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    line_id: '',
    num_people: 1,
    booking_date: '',
    time_slot: '',
  })
  const [slotAvailability, setSlotAvailability] = useState<Record<string, number>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchSlotAvailability(date: string) {
    if (!date) return
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/availability?date=${date}`)
      const data = await res.json()
      setSlotAvailability(data)
    } catch {
      setSlotAvailability({})
    } finally {
      setLoadingSlots(false)
    }
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value
    setForm(f => ({ ...f, booking_date: date, time_slot: '' }))
    fetchSlotAvailability(date)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.booking_date || !form.time_slot) {
      setError('請選擇入園日期與時段')
      return
    }

    const available = slotAvailability[form.time_slot] ?? MAX_PER_SLOT
    if (form.num_people > available) {
      setError(`此時段僅剩 ${available} 個名額，如需包場請洽詢`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '預約失敗')
      router.push(`/success?id=${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '預約失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const deposit = calcDeposit(form.num_people)
  const total = calcTotal(form.num_people)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-stone-50">
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-5 text-center">
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-1">Voyage 陽明山</p>
          <h1 className="text-2xl font-semibold text-stone-800">園區入園預約</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-stone-700 mb-3">入園資訊</h2>
          <div className="space-y-2 text-sm text-stone-600">
            <div className="flex justify-between">
              <span>票價</span>
              <span className="font-medium">NT$ {TICKET_PRICE} / 人</span>
            </div>
            <div className="flex justify-between">
              <span>訂金（預約時付）</span>
              <span className="font-medium">NT$ {DEPOSIT_PER_PERSON} / 人</span>
            </div>
            <div className="flex justify-between">
              <span>時段長度</span>
              <span className="font-medium">2 小時</span>
            </div>
            <div className="flex justify-between">
              <span>每時段上限</span>
              <span className="font-medium">{MAX_PER_SLOT} 人（超過請洽詢包場）</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-stone-800 text-lg">填寫預約資料</h2>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">姓名 *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="請輸入姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">電話 *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="09xxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">LINE ID</label>
            <input
              type="text"
              value={form.line_id}
              onChange={e => setForm(f => ({ ...f, line_id: e.target.value }))}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="選填，用於接收自動通知"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">入園日期 *</label>
            <input
              type="date"
              required
              min={today}
              value={form.booking_date}
              onChange={handleDateChange}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {form.booking_date && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                入園時段 *
                {loadingSlots && <span className="text-stone-400 font-normal ml-2">載入中…</span>}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(slot => {
                  const available = slotAvailability[slot] ?? MAX_PER_SLOT
                  const isFull = available === 0
                  const selected = form.time_slot === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isFull}
                      onClick={() => setForm(f => ({ ...f, time_slot: slot }))}
                      className={`py-2.5 px-1 rounded-lg text-xs font-medium border transition-all ${
                        isFull
                          ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                          : selected
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-green-500'
                      }`}
                    >
                      <div>{slot}</div>
                      {isFull ? (
                        <div className="text-[10px] mt-0.5">額滿</div>
                      ) : available < MAX_PER_SLOT ? (
                        <div className="text-[10px] mt-0.5">剩 {available}</div>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              {form.time_slot && (
                <p className="text-xs text-stone-500 mt-2">
                  時段：{form.time_slot} – {getSlotEndTime(form.time_slot)}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">入園人數 *</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, num_people: Math.max(1, f.num_people - 1) }))}
                className="w-10 h-10 rounded-full border border-stone-300 text-lg font-medium hover:bg-stone-50 flex items-center justify-center"
              >−</button>
              <span className="text-xl font-semibold w-8 text-center">{form.num_people}</span>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, num_people: Math.min(MAX_PER_SLOT, f.num_people + 1) }))}
                className="w-10 h-10 rounded-full border border-stone-300 text-lg font-medium hover:bg-stone-50 flex items-center justify-center"
              >+</button>
              {form.num_people >= MAX_PER_SLOT && (
                <p className="text-xs text-orange-600">超過 {MAX_PER_SLOT} 人請洽詢包場</p>
              )}
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>票價合計（{form.num_people} 人）</span>
              <span>NT$ {total}</span>
            </div>
            <div className="flex justify-between font-semibold text-green-700 text-base border-t border-green-200 pt-2">
              <span>應付訂金</span>
              <span>NT$ {deposit}</span>
            </div>
            <p className="text-xs text-stone-500">餘款 NT$ {total - deposit} 於入園當日現場繳付</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-stone-300 text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
          >
            {submitting ? '提交中…' : '確認預約'}
          </button>

          <p className="text-xs text-stone-400 text-center">
            送出後請在 1 小時內完成訂金匯款，逾時預約將自動取消
          </p>
        </form>
      </div>
    </main>
  )
}
