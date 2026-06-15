'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
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
  const [loginError, setLoginError] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  // Run synchronously before paint to avoid flash
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem('adminPwd')
    if (!saved) return
    // Trust immediately, verify in background
    setPassword(saved)
    setAuthed(true)
    fetch('/api/admin/auth', { headers: { 'x-admin-password': saved } })
      .then(res => {
        if (!res.ok) {
          sessionStorage.removeItem('adminPwd')
          setAuthed(false)
          setPassword('')
        }
      })
      .catch(() => {})
  }, [])

  async function handleLogin() {
    const res = await fetch('/api/admin/auth', {
      headers: { 'x-admin-password': password },
    }).catch(() => null)
    if (res?.ok) {
      sessionStorage.setItem('adminPwd', password)
      setAuthed(true)
      setLoginError('')
    } else {
      setLoginError(`密碼錯誤`)
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-800 mb-6 text-center">管理後台</h1>
          <div className="relative mb-3">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="請輸入管理密碼"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs px-1"
            >
              {showPwd ? '隱藏' : '顯示'}
            </button>
          </div>
          {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2.5 rounded-lg"
          >
            登入
          </button>
        </div>
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
