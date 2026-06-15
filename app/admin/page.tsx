'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Booking = {
  id: string
  name: string
  phone: string
  line_id: string | null
  line_user_id: string | null
  num_people: number
  booking_date: string
  time_slot: string
  total_price: number
  deposit: number
  status: string
  payment_confirmed: boolean
  transfer_last5: string | null
  checked_in: boolean
  created_at: string
}

// ─── 左滑報到元件 ───────────────────────────────
function SwipeCard({
  onCheckin,
  onUndo,
  checkedIn,
  children,
}: {
  onCheckin: () => void
  onUndo: () => void
  checkedIn: boolean
  children: React.ReactNode
}) {
  const [tx, setTx] = useState(0)
  const dragging = useRef(false)
  const startX = useRef(0)
  const THRESHOLD = -90

  function onStart(clientX: number) {
    dragging.current = true
    startX.current = clientX
  }
  function onMove(clientX: number) {
    if (!dragging.current) return
    const diff = clientX - startX.current
    if (diff < 0) setTx(Math.max(diff, -120))
  }
  function onEnd() {
    if (!dragging.current) return
    dragging.current = false
    if (tx <= THRESHOLD) {
      onCheckin()
    }
    setTx(0)
  }

  return (
    <div className="relative rounded-xl overflow-hidden select-none">
      <div className={`absolute inset-0 flex items-center justify-end pr-5 rounded-xl transition-colors ${checkedIn ? 'bg-stone-200' : 'bg-green-500'}`}>
        <div className="text-center">
          <div className="text-2xl">{checkedIn ? '↩️' : '✅'}</div>
          <div className="text-white text-xs font-bold mt-0.5">{checkedIn ? '取消報到' : '確認報到'}</div>
        </div>
      </div>
      <div
        style={{ transform: `translateX(${tx}px)`, transition: dragging.current ? 'none' : 'transform 0.25s ease' }}
        onTouchStart={e => onStart(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={e => onStart(e.clientX)}
        onMouseMove={e => onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        {children}
      </div>
    </div>
  )
}

// ─── 主頁面 ───────────────────────────────
export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    setPassword(localStorage.getItem('adminPwd') || sessionStorage.getItem('adminPwd') || '')
  }, [])
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'checked_in'>('all')
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    const res = await fetch('/api/admin/bookings', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) setBookings(await res.json())
  }, [password])

  useEffect(() => {
    if (password) fetchBookings()
  }, [password, fetchBookings])

  async function confirmPayment(id: string) {
    setConfirming(id)
    try {
      const res = await fetch('/api/admin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id }),
      })
      if (res.ok) await fetchBookings()
      else alert((await res.json()).error || '確認失敗')
    } finally {
      setConfirming(null)
    }
  }

  async function toggleCheckin(id: string, currentValue: boolean) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, checked_in: !currentValue } : b))
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ checked_in: !currentValue }),
    })
  }

  async function deleteBooking(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      if (res.ok) setBookings(prev => prev.filter(b => b.id !== id))
      else alert('刪除失敗')
    } finally {
      setDeleting(null)
      setDeleteConfirm(null)
    }
  }

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.phone.slice(-3) === search || b.name.includes(search)
    if (!matchSearch) return false
    if (filter === 'pending') return !b.payment_confirmed && b.status !== 'cancelled' && !b.checked_in
    if (filter === 'confirmed') return b.payment_confirmed && !b.checked_in
    if (filter === 'checked_in') return b.checked_in
    return true
  })

  const pendingCount = bookings.filter(b => !b.payment_confirmed && b.status !== 'cancelled' && !b.checked_in).length
  const checkinCount = bookings.filter(b => b.checked_in).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* 統計徽章 */}
      {(pendingCount > 0 || checkinCount > 0) && (
        <div className="flex gap-2 mb-5">
          {pendingCount > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full">
              {pendingCount} 筆待確認
            </span>
          )}
          {checkinCount > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
              ✅ {checkinCount} 已報到
            </span>
          )}
        </div>
      )}

      {/* 現場報到搜尋 */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 mb-5">
        <p className="text-xs font-medium text-stone-500 mb-2">🔍 現場報到 — 輸入手機末三碼搜尋</p>
        <div className="flex gap-2 items-center">
          <input
            type="tel"
            maxLength={3}
            value={search}
            onChange={e => setSearch(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="末三碼（如 225）"
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-stone-400 hover:text-stone-600 text-sm px-2">
              清除
            </button>
          )}
        </div>
        {search.length === 3 && (
          <p className="text-xs text-stone-400 mt-2">找到 {filtered.length} 筆符合的預約</p>
        )}
      </div>

      {/* 說明提示 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
        <span className="text-amber-600 text-sm">←</span>
        <p className="text-xs text-amber-700">預約卡片可以<span className="font-semibold">向左滑動</span>完成現場報到，再次左滑可取消</p>
      </div>

      {/* 篩選列 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          ['all', '全部'],
          ['pending', '待確認'],
          ['confirmed', '已確認'],
          ['checked_in', '已完成'],
        ] as const).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-amber-700 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={fetchBookings}
          className="ml-auto px-4 py-2 rounded-lg text-sm border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
        >
          重新整理
        </button>
      </div>

      {/* 預約清單 */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-stone-400 py-12">
            {search ? `找不到手機末三碼為「${search}」的預約` : '目前沒有預約'}
          </div>
        )}
        {filtered.map(b => {
          const [y, m, d] = b.booking_date.split('-')
          const dateStr = `${y}/${m}/${d}`
          const endHour = String(parseInt(b.time_slot.split(':')[0]) + 2).padStart(2, '0')
          const isDeleteConfirming = deleteConfirm === b.id

          return (
            <SwipeCard
              key={b.id}
              checkedIn={b.checked_in}
              onCheckin={() => toggleCheckin(b.id, b.checked_in)}
              onUndo={() => toggleCheckin(b.id, b.checked_in)}
            >
              <div className={`bg-white rounded-xl border shadow-sm p-5 ${
                b.checked_in
                  ? 'border-stone-200 opacity-70'
                  : b.payment_confirmed
                  ? 'border-green-200'
                  : 'border-orange-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`font-semibold ${b.checked_in ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                        {b.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.checked_in
                          ? 'bg-stone-100 text-stone-500'
                          : b.payment_confirmed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {b.checked_in ? '✅ 已報到' : b.payment_confirmed ? '已確認' : '待匯款'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-stone-600">
                      <span>📅 {dateStr} {b.time_slot}–{endHour}:00</span>
                      <span>👥 {b.num_people} 人</span>
                      <span>📞 {b.phone}</span>
                      <span>💰 NT$ {b.deposit}</span>
                      {b.transfer_last5 && (
                        <span className="col-span-2 text-amber-700 font-medium">🏦 末五碼：{b.transfer_last5}</span>
                      )}
                      {b.line_user_id && (
                        <span className="col-span-2 text-green-600 text-xs">✅ LINE 已綁定</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {!b.payment_confirmed && !b.checked_in && b.status !== 'cancelled' && (
                      <button
                        onClick={() => confirmPayment(b.id)}
                        disabled={confirming === b.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-stone-300 text-white text-sm font-medium px-4 py-2 rounded-lg"
                      >
                        {confirming === b.id ? '確認中…' : '確認匯款'}
                      </button>
                    )}
                    {isDeleteConfirming ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => deleteBooking(b.id)}
                          disabled={deleting === b.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-stone-300 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                        >
                          {deleting === b.id ? '刪除中…' : '確認刪除'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium px-3 py-1.5 rounded-lg"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(b.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium px-4 py-2 rounded-lg border border-red-200 hover:border-red-400 hover:bg-red-50 transition-colors"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SwipeCard>
          )
        })}
      </div>
    </div>
  )
}
