'use client'

import { useState, useEffect, useCallback } from 'react'

type OrderItem = {
  id: string
  item_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

type Order = {
  id: string
  note: string | null
  status: string
  payment_method: 'cash' | 'linepay' | 'jkopay'
  total_price: number
  amount_paid: number | null
  change_amount: number | null
  created_at: string
  order_items: OrderItem[]
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: '💵 現金',
  linepay: '💚 LINE Pay',
  jkopay: '🔵 街口支付',
}


function toTaipeiDateStr(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

function toTaipeiTimeStr(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit', minute: '2-digit',
  })
}

function getTaipeiToday() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })
}

export default function AdminOrdersPage() {
  const [password, setPassword] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    setPassword(sessionStorage.getItem('adminPwd') || '')
  }, [])
  const [dateFilter, setDateFilter] = useState(getTaipeiToday())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function deleteOrder(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== id))
        setDeleteConfirm(null)
      } else {
        alert('刪除失敗')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const fetchOrders = useCallback(async (date: string) => {
    const res = await fetch(`/api/admin/orders?date=${date}`, {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) setOrders(await res.json())
  }, [password])

  useEffect(() => { if (password) fetchOrders(dateFilter) }, [password, dateFilter, fetchOrders])

  const completed = orders.filter(o => o.status === 'completed')
  const dailyTotal = completed.reduce((sum, o) => sum + o.total_price, 0)
  const countByCash = completed.filter(o => o.payment_method === 'cash').length
  const countByLinepay = completed.filter(o => o.payment_method === 'linepay').length
  const countByJko = completed.filter(o => o.payment_method === 'jkopay').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* 日期篩選 */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-4 flex items-center gap-4">
          <label className="text-sm font-medium text-stone-700 shrink-0">日期</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={() => setDateFilter(getTaipeiToday())}
            className="text-xs text-amber-700 hover:underline"
          >
            回今天
          </button>
        </div>

        {/* 當日摘要 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: '當日營收', value: `NT$ ${dailyTotal}`, highlight: true },
            { label: '訂單數', value: `${completed.length} 筆` },
            { label: '現金', value: `${countByCash} 筆` },
            { label: 'LINE Pay / 街口', value: `${countByLinepay + countByJko} 筆` },
          ].map(stat => (
            <div key={stat.label} className={`bg-white rounded-2xl border shadow-sm px-4 py-4 ${stat.highlight ? 'border-amber-200 bg-amber-50' : 'border-stone-200'}`}>
              <p className="text-xs text-stone-500 mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.highlight ? 'text-amber-800' : 'text-stone-800'}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 訂單清單 */}
        {orders.length === 0 ? (
          <p className="text-center text-stone-400 py-12">此日無訂單</p>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const isExpanded = expandedId === order.id
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-800">NT$ {order.total_price}</span>
                        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                          {PAYMENT_LABEL[order.payment_method]}
                        </span>
                        {order.note && (
                          <span className="text-xs text-stone-400">｜{order.note}</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {toTaipeiDateStr(order.created_at)} {toTaipeiTimeStr(order.created_at)}
                        　{order.order_items.length} 項商品
                      </p>
                    </div>
                    <span className="text-stone-400 text-sm shrink-0">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-stone-100 px-5 py-4 space-y-2">
                      {order.order_items.map(oi => (
                        <div key={oi.id} className="flex justify-between text-sm text-stone-600">
                          <span>{oi.item_name} × {oi.quantity}</span>
                          <span>NT$ {oi.subtotal}</span>
                        </div>
                      ))}
                      <div className="border-t border-stone-100 pt-2 mt-1 space-y-1">
                        <div className="flex justify-between font-semibold text-stone-800">
                          <span>合計</span>
                          <span>NT$ {order.total_price}</span>
                        </div>
                        {order.payment_method === 'cash' && order.amount_paid != null && (
                          <>
                            <div className="flex justify-between text-xs text-stone-500">
                              <span>客人付款</span>
                              <span>NT$ {order.amount_paid}</span>
                            </div>
                            <div className="flex justify-between text-xs text-stone-500">
                              <span>找零</span>
                              <span>NT$ {order.change_amount ?? 0}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="border-t border-stone-100 pt-3 flex justify-end">
                        {deleteConfirm === order.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => deleteOrder(order.id)}
                              disabled={deletingId === order.id}
                              className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-stone-300"
                            >
                              {deletingId === order.id ? '刪除中…' : '確認刪除'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(order.id)}
                            className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                          >
                            刪除訂單
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
  )
}
