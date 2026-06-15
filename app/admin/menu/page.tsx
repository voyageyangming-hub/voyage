'use client'

import { getAdminPwd } from '@/lib/admin-auth'
import { useState, useEffect, useCallback } from 'react'

type MenuItem = {
  id: string
  name: string
  category: string
  price: number
  stock_qty: number
  low_stock_alert: number
  is_available: boolean
  has_temperature: boolean
  sort_order: number
}

const EMPTY_FORM = { name: '', category: '', price: '', stock_qty: '', low_stock_alert: '5', sort_order: '0', has_temperature: false }

export default function AdminMenuPage() {
  const [password, setPassword] = useState('')
  const [items, setItems] = useState<MenuItem[]>([])

  useEffect(() => {
    setPassword(getAdminPwd())
  }, [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/admin/menu', { headers: { 'x-admin-password': password } })
    if (res.ok) setItems(await res.json())
  }, [password])

  useEffect(() => { if (password) fetchItems() }, [password, fetchItems])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          price: parseInt(form.price),
          stock_qty: form.stock_qty === '' ? -1 : parseInt(form.stock_qty),
          low_stock_alert: parseInt(form.low_stock_alert) || 5,
          sort_order: parseInt(form.sort_order) || 0,
          has_temperature: form.has_temperature,
        }),
      })
      if (res.ok) {
        setForm(EMPTY_FORM)
        setShowAddForm(false)
        fetchItems()
      } else {
        alert((await res.json()).error || '新增失敗')
      }
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(editForm),
      })
      if (res.ok) { setEditingId(null); fetchItems() }
      else alert((await res.json()).error || '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailable(item: MenuItem) {
    await fetch(`/api/admin/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ is_available: !item.is_available }),
    })
    fetchItems()
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    })
    if (res.ok) { setDeletingId(null); fetchItems() }
    else alert('刪除失敗')
  }

  const categories = Array.from(new Set(items.map(i => i.category)))

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* 新增品項 */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
          >
            <span className="font-semibold text-stone-800">＋ 新增品項</span>
            <span className="text-stone-400 text-sm">{showAddForm ? '收起' : '展開'}</span>
          </button>

          {showAddForm && (
            <form onSubmit={handleAdd} className="border-t border-stone-100 px-5 py-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">品項名稱 *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="例：拿鐵" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">分類 *</label>
                  <input required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    list="category-list"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="例：飲料" />
                  <datalist id="category-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">售價（NT$）*</label>
                  <input required type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="150" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">庫存數量（空白 = 無限）</label>
                  <input type="number" min="0" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="留空表示無限" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">低庫存警示</label>
                  <input type="number" min="0" value={form.low_stock_alert} onChange={e => setForm(f => ({ ...f, low_stock_alert: e.target.value }))}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">排序（數字越小越前面）</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <input type="checkbox" id="has_temp" checked={!!form.has_temperature}
                    onChange={e => setForm(f => ({ ...f, has_temperature: e.target.checked }))}
                    className="w-4 h-4 accent-amber-700" />
                  <label htmlFor="has_temp" className="text-xs font-medium text-stone-600 cursor-pointer">
                    可選溫度（熱 / 冰）
                  </label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">取消</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg disabled:bg-stone-300">
                  {saving ? '儲存中…' : '新增'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 品項清單 */}
        {categories.length === 0 ? (
          <p className="text-center text-stone-400 py-12">尚無品項，點上方新增</p>
        ) : (
          categories.map(cat => (
            <div key={cat} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-stone-50 px-5 py-3 border-b border-stone-100">
                <h2 className="font-semibold text-stone-700">{cat}</h2>
              </div>
              <div className="divide-y divide-stone-100">
                {items.filter(i => i.category === cat).map(item => {
                  const isEditing = editingId === item.id
                  const isDeleting = deletingId === item.id
                  const stockLabel = item.stock_qty === -1 ? '無限' : String(item.stock_qty)
                  const lowStock = item.stock_qty >= 0 && item.stock_qty <= item.low_stock_alert

                  return (
                    <div key={item.id} className={`px-5 py-4 ${!item.is_available ? 'opacity-50' : ''}`}>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-stone-500 mb-0.5 block">名稱</label>
                              <input value={editForm.name ?? item.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                              <label className="text-xs text-stone-500 mb-0.5 block">售價</label>
                              <input type="number" value={editForm.price ?? item.price}
                                onChange={e => setEditForm(f => ({ ...f, price: parseInt(e.target.value) }))}
                                className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                              <label className="text-xs text-stone-500 mb-0.5 block">庫存（-1 = 無限）</label>
                              <input type="number" value={editForm.stock_qty ?? item.stock_qty}
                                onChange={e => setEditForm(f => ({ ...f, stock_qty: parseInt(e.target.value) }))}
                                className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                              <label className="text-xs text-stone-500 mb-0.5 block">低庫存警示</label>
                              <input type="number" value={editForm.low_stock_alert ?? item.low_stock_alert}
                                onChange={e => setEditForm(f => ({ ...f, low_stock_alert: parseInt(e.target.value) }))}
                                className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-xs text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">取消</button>
                            <button onClick={() => saveEdit(item.id)} disabled={saving}
                              className="px-4 py-1.5 text-xs bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 disabled:bg-stone-300">
                              {saving ? '儲存中…' : '儲存'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-stone-800">{item.name}</span>
                              <span className="text-[#7c5c44] font-bold">NT$ {item.price}</span>
                              {lowStock && item.stock_qty > 0 && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                  低庫存 {item.stock_qty}
                                </span>
                              )}
                              {item.stock_qty === 0 && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">售完</span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5">
                              庫存：{stockLabel}　低庫存警示：{item.low_stock_alert}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                            {/* 熱/冰 toggle */}
                            <button
                              onClick={() => fetch(`/api/admin/menu/${item.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
                                body: JSON.stringify({ has_temperature: !item.has_temperature }),
                              }).then(() => fetchItems())}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                                item.has_temperature
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                  : 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                              }`}
                            >
                              {item.has_temperature ? '☕ 熱/冰' : '熱/冰 off'}
                            </button>
                            {/* 上架/下架 toggle */}
                            <button
                              onClick={() => toggleAvailable(item)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                                item.is_available
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                  : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                              }`}
                            >
                              {item.is_available ? '上架中' : '已下架'}
                            </button>

                            <button
                              onClick={() => { setEditingId(item.id); setEditForm({}) }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                            >
                              編輯
                            </button>

                            {isDeleting ? (
                              <div className="flex gap-1">
                                <button onClick={() => deleteItem(item.id)}
                                  className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">確認刪除</button>
                                <button onClick={() => setDeletingId(null)}
                                  className="text-xs px-2 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50">取消</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeletingId(item.id)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                                刪除
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
  )
}
