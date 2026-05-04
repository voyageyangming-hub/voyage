'use client'

import { useState, useEffect, useCallback } from 'react'

type Booking = {
  id: string
  name: string
  phone: string
  line_id: string | null
  num_people: number
  booking_date: string
  time_slot: string
  total_price: number
  deposit: number
  status: string
  payment_confirmed: boolean
  created_at: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchBookings = useCallback(async () => {
    const params = filter !== 'all' ? `?status=${filter}` : ''
    const res = await fetch(`/api/admin/bookings${params}`, {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) {
      setBookings(await res.json())
    }
  }, [filter, password])

  useEffect(() => {
    if (authed) fetchBookings()
  }, [authed, fetchBookings])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/bookings', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) {
      setAuthed(true)
    } else {
      setError('密碼錯誤')
    }
  }

  async function confirmPayment(id: string) {
    setConfirming(id)
    try {
      const res = await fetch('/api/admin/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        await fetchBookings()
      } else {
        const data = await res.json()
        alert(data.error || '確認失敗')
      }
    } finally {
      setConfirming(null)
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-800 mb-6 text-center">管理後台</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="請輸入管理密碼"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg"
          >
            登入
          </button>
        </form>
      </main>
    )
  }

  const pendingCount = bookings.filter(b => !b.payment_confirmed && b.status !== 'cancelled').length

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-800">Voyage 陽明山 管理後台</h1>
            <p className="text-xs text-stone-400">預約管理</p>
          </div>
          {pendingCount > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full">
              {pendingCount} 筆待確認
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-5">
          {(['all', 'pending', 'confirmed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {f === 'all' ? '全部' : f === 'pending' ? '待確認' : '已確認'}
            </button>
          ))}
          <button
            onClick={fetchBookings}
            className="ml-auto px-4 py-2 rounded-lg text-sm border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          >
            重新整理
          </button>
        </div>

        <div className="space-y-3">
          {bookings.length === 0 && (
            <div className="text-center text-stone-400 py-12">目前沒有預約</div>
          )}
          {bookings.map(b => {
            const [y, m, d] = b.booking_date.split('-')
            const dateStr = `${y}/${m}/${d}`
            const endHour = String(parseInt(b.time_slot.split(':')[0]) + 2).padStart(2, '0')
            return (
              <div
                key={b.id}
                className={`bg-white rounded-xl border shadow-sm p-5 ${
                  b.payment_confirmed ? 'border-green-200' : 'border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-stone-800">{b.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.payment_confirmed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {b.payment_confirmed ? '已確認' : '待匯款'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-stone-600">
                      <span>📅 {dateStr} {b.time_slot}–{endHour}:00</span>
                      <span>👥 {b.num_people} 人</span>
                      <span>📞 {b.phone}</span>
                      {b.line_id && <span>LINE: {b.line_id}</span>}
                      <span>💰 訂金 NT$ {b.deposit}</span>
                    </div>
                  </div>
                  {!b.payment_confirmed && b.status !== 'cancelled' && (
                    <button
                      onClick={() => confirmPayment(b.id)}
                      disabled={confirming === b.id}
                      className="shrink-0 bg-green-600 hover:bg-green-700 disabled:bg-stone-300 text-white text-sm font-medium px-4 py-2 rounded-lg"
                    >
                      {confirming === b.id ? '確認中…' : '確認匯款'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
