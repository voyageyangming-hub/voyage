'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/admin', label: '預約管理' },
  { href: '/admin/menu', label: '菜單 & 庫存' },
  { href: '/admin/orders', label: '訂單記錄' },
  { href: '/pos', label: '🖥️ POS 點餐' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('adminPwd')
    if (saved) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      fetch('/api/admin/bookings', {
        headers: { 'x-admin-password': saved },
        signal: controller.signal,
      })
        .then(res => {
          clearTimeout(timer)
          if (res.ok) { setPassword(saved); setAuthed(true) }
          setChecking(false)
        })
        .catch(() => {
          clearTimeout(timer)
          setChecking(false)
        })
    } else {
      setChecking(false)
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/bookings', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) {
      sessionStorage.setItem('adminPwd', password)
      setAuthed(true)
      setLoginError('')
    } else {
      setLoginError('密碼錯誤')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">驗證中…</p>
      </div>
    )
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
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
          <button type="submit" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2.5 rounded-lg">
            登入
          </button>
        </form>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-stone-800">Voyage 陽明山 管理後台</h1>
        </div>
      </header>
      <nav className="flex gap-1 px-4 py-2 bg-stone-100 border-b border-stone-200 overflow-x-auto">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              pathname === link.href
                ? 'bg-amber-700 text-white'
                : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
