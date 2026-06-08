'use client'

import { useState, useEffect } from 'react'

type MenuItem = {
  id: string
  name: string
  category: string
  price: number
  stock_qty: number
  low_stock_alert: number
  is_available: boolean
}

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

type PaymentMethod = 'cash' | 'linepay' | 'jkopay'

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'cash', label: '現金', icon: '💵' },
  { key: 'linepay', label: 'LINE Pay', icon: '💚' },
  { key: 'jkopay', label: '街口支付', icon: '🔵' },
]

const QUICK_CASH = [100, 200, 500, 1000]

export default function POSPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [note, setNote] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  function loadMenu() {
    fetch('/api/menu').then(r => r.json()).then(setItems).catch(() => {})
  }

  useEffect(() => { loadMenu() }, [])

  const categories = ['全部', ...Array.from(new Set(items.map(i => i.category)))]
  const visibleItems = selectedCategory === '全部'
    ? items
    : items.filter(i => i.category === selectedCategory)

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const paid = parseInt(amountPaid) || 0
  const change = paymentMethod === 'cash' ? paid - total : 0

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart(prev =>
      prev.map(c => c.id === id ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0)
    )
  }

  function openCheckout() {
    setPaymentMethod(null)
    setAmountPaid('')
    setCheckoutOpen(true)
  }

  function closeCheckout() {
    setCheckoutOpen(false)
    setPaymentMethod(null)
    setAmountPaid('')
  }

  async function submitOrder() {
    if (!paymentMethod) return
    if (paymentMethod === 'cash' && paid < total) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: note || null,
          payment_method: paymentMethod,
          total_price: total,
          amount_paid: paymentMethod === 'cash' ? paid : total,
          change_amount: paymentMethod === 'cash' ? change : 0,
          items: cart.map(c => ({
            menu_item_id: c.id,
            item_name: c.name,
            quantity: c.quantity,
            unit_price: c.price,
            subtotal: c.price * c.quantity,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || '結帳失敗')
        return
      }

      const totalStr = `NT$ ${total}`
      setCart([])
      setNote('')
      closeCheckout()
      setSuccessMsg(totalStr)
      loadMenu()
      setTimeout(() => setSuccessMsg(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const canConfirm =
    !!paymentMethod &&
    (paymentMethod !== 'cash' || (!!amountPaid && paid >= total))

  return (
    <div className="h-screen flex flex-col bg-stone-100 overflow-hidden">
      {/* Header */}
      <header className="bg-[#5c4232] text-white px-5 py-3 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] tracking-widest text-[#f5e6d8] uppercase">VYM Cafe</p>
          <h1 className="text-base font-semibold leading-tight">POS 點餐系統</h1>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <span className="bg-green-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
              ✅ 結帳完成 {successMsg}
            </span>
          )}
          <a
            href="/admin"
            className="text-[#f5e6d8] text-xs hover:text-white underline"
          >
            後台
          </a>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── 左側：菜單 ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-stone-200">

          {/* 分類 tabs */}
          <div className="flex gap-2 px-4 py-2.5 overflow-x-auto shrink-0 bg-white border-b border-stone-200">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#7c5c44] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 品項格狀 */}
          <div className="flex-1 overflow-y-auto p-4">
            {visibleItems.length === 0 ? (
              <p className="text-stone-400 text-sm text-center mt-12">
                {items.length === 0 ? '載入中…' : '此分類沒有品項'}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {visibleItems.map(item => {
                  const cartQty = cart.find(c => c.id === item.id)?.quantity ?? 0
                  const soldOut = item.stock_qty === 0
                  const lowStock = item.stock_qty > 0 && item.stock_qty <= item.low_stock_alert

                  return (
                    <button
                      key={item.id}
                      disabled={soldOut}
                      onClick={() => addToCart(item)}
                      className={`relative bg-white rounded-2xl p-4 text-left shadow-sm border transition-all active:scale-95 select-none ${
                        soldOut
                          ? 'opacity-50 cursor-not-allowed border-stone-200'
                          : cartQty > 0
                          ? 'border-[#7c5c44] ring-2 ring-[#7c5c44]/20'
                          : 'border-stone-200 hover:border-[#7c5c44]/50 hover:shadow-md'
                      }`}
                    >
                      {cartQty > 0 && (
                        <span className="absolute top-2 right-2 bg-[#7c5c44] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          {cartQty}
                        </span>
                      )}
                      <p className="font-medium text-stone-800 text-sm leading-snug mb-2 pr-6">{item.name}</p>
                      <p className="text-[#7c5c44] font-bold text-xl">NT$ {item.price}</p>
                      {soldOut && <p className="text-xs text-red-500 mt-1 font-medium">售完</p>}
                      {lowStock && <p className="text-xs text-orange-500 mt-1">剩 {item.stock_qty}</p>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── 右側：購物車 ── */}
        <div className="w-72 flex flex-col bg-white shrink-0">

          {/* 備註 */}
          <div className="px-4 pt-4 pb-3 border-b border-stone-100">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="桌號 / 備註（選填）"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5c44]/30"
            />
          </div>

          {/* 購物車清單 */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <p className="text-stone-400 text-sm text-center mt-10">尚未點餐</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                      <p className="text-xs text-stone-400">NT$ {item.price}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center text-base"
                      >−</button>
                      <span className="w-5 text-center font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center text-base"
                      >+</button>
                    </div>
                    <span className="text-sm font-medium text-stone-700 w-14 text-right shrink-0">
                      NT$ {item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 合計 + 按鈕 */}
          <div className="px-4 py-4 border-t border-stone-200 bg-stone-50 shrink-0 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium text-sm">合計</span>
              <span className="text-2xl font-bold text-stone-900">NT$ {total}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="px-3 py-3 rounded-xl border border-stone-200 text-stone-500 text-sm hover:bg-stone-100 disabled:opacity-40 transition-colors"
              >
                清空
              </button>
              <button
                onClick={openCheckout}
                disabled={cart.length === 0}
                className="flex-1 bg-[#7c5c44] hover:bg-[#5c4232] disabled:bg-stone-300 text-white font-semibold py-3 rounded-xl text-base transition-colors"
              >
                結帳
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 結帳 Modal ── */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="bg-[#5c4232] px-6 py-4">
              <h2 className="text-white font-semibold text-lg">結帳</h2>
              {note && <p className="text-[#f5e6d8] text-sm mt-0.5">{note}</p>}
            </div>

            <div className="p-5 space-y-5">

              {/* 訂單摘要 */}
              <div className="bg-stone-50 rounded-xl p-4 space-y-1.5">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-stone-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>NT$ {item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-stone-900 text-xl border-t border-stone-200 pt-2 mt-1">
                  <span>總計</span>
                  <span>NT$ {total}</span>
                </div>
              </div>

              {/* 付款方式 */}
              <div>
                <p className="text-sm font-medium text-stone-700 mb-2">付款方式</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_OPTIONS.map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => { setPaymentMethod(key); setAmountPaid('') }}
                      className={`py-3 rounded-xl border text-sm font-medium flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === key
                          ? 'bg-[#7c5c44] text-white border-[#7c5c44]'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-[#7c5c44]/50'
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 現金找零計算機 */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">客人付款</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder="輸入金額"
                      className="w-full border border-stone-300 rounded-xl px-4 py-3 text-2xl font-bold text-right focus:outline-none focus:ring-2 focus:ring-[#7c5c44]/30"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_CASH.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setAmountPaid(String(amt))}
                        className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                          amountPaid === String(amt)
                            ? 'bg-[#7c5c44] text-white'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>

                  {paid >= total && paid > 0 && (
                    <div className={`rounded-xl p-4 text-center ${change === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                      <p className="text-xs text-stone-500 mb-1">找零</p>
                      <p className={`text-4xl font-bold ${change === 0 ? 'text-green-700' : 'text-amber-700'}`}>
                        NT$ {change}
                      </p>
                    </div>
                  )}
                  {paid > 0 && paid < total && (
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <p className="text-red-600 text-sm font-semibold">差額 NT$ {total - paid}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 按鈕 */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeCheckout}
                  className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={submitOrder}
                  disabled={submitting || !canConfirm}
                  className="flex-1 bg-[#7c5c44] hover:bg-[#5c4232] disabled:bg-stone-300 text-white font-semibold py-3 rounded-xl transition-colors text-base"
                >
                  {submitting ? '處理中…' : '確認收款'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
