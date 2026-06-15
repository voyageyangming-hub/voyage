'use client'

import { useState, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getAdminPwd, saveAdminPwd } from '@/lib/admin-auth'

const NAV_LINKS = [
  { href: '/admin', label: '預約管理' },
  { href: '/admin/menu', label: '菜單 & 庫存' },
  { href: '/admin/orders', label: '訂單記錄' },
  { href: '/pos', label: '🖥️ POS 點餐' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useLayoutEffect(() => {
    if (getAdminPwd()) setAuthed(true)
  }, [])

  async function login() {
    if (!pwd) { setError('請輸入密碼'); return }
    setLoading(true)
    setError('')
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd))
      const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      if (hex === 'f283c7cbb4dca604c8d93f82c717afab9a27d8ee02ce95a1fca14a2044de6ca6') {
        saveAdminPwd(pwd)
        setAuthed(true)
      } else {
        setError('密碼錯誤')
      }
    } catch {
      setError('驗證失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-800 mb-6 text-center">管理後台</h1>
          <input
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="請輸入管理密碼"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-amber-700 text-white font-semibold py-3 rounded-lg text-base disabled:opacity-50"
          >
            {loading ? '驗證中…' : '登入'}
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
              pathname === link.href ? 'bg-amber-700 text-white' : 'text-stone-600 hover:bg-stone-200'
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
